import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "@discordjs/builders";
import { APIWebhook, MessageFlags } from "discord-api-types/v10";
import { eq, sql } from "drizzle-orm";
import { getDb, getchTriggerGuild, upsertDiscordUser } from "store";
import {
  backups,
  triggers as dTriggers,
  flowActions,
  flows,
  generateId,
} from "store/src/schema/schema.js";
import {
  FlowAction,
  FlowActionSetVariableType,
  FlowActionType
} from "store/src/types/components.js";
import { TriggerEvent } from "store/src/types/triggers.js";
import { ChatInputAppCommandCallback } from "../../commands.js";
import { AutoComponentCustomId } from "../../components.js";
import { getEmojis } from "../../emojis.js";
import { getErrorMessage } from "../../errors.js";
import { getWelcomerConfigurations } from "../../events/guildMemberAdd.js";
import { getShareLink } from "../../share-links.js";
import { isDiscordError } from "../../util/error.js";
import { parseShareLink } from "../components/quick.js";
import { getWebhook } from "../webhooks/webhookInfo.js";
import {
  getWelcomerConfigEmbed,
  getWelcomerConfigFromActions,
} from "./view.js";

export type WelcomerTriggerEvent =
  | TriggerEvent.MemberAdd
  | TriggerEvent.MemberRemove;

const buildSimpleWelcomer = (props: {
  webhookId?: string;
  channelId?: string;
  backupId: string;
  backupMessageIndex?: number | null;
  flags?: MessageFlags;
  deleteAfter?: number;
}) => {
  const {
    webhookId,
    channelId,
    backupId,
    backupMessageIndex,
    flags,
    deleteAfter,
  } = props;

  const actions: FlowAction[] = [];
  if (channelId) {
    actions.push(
      {
        type: FlowActionType.SetVariable,
        name: "channelId",
        value: channelId,
      },
      {
        type: FlowActionType.SendMessage,
        backupId,
        backupMessageIndex,
        flags,
      },
    );
  } else if (webhookId) {
    actions.push({
      type: FlowActionType.SendWebhookMessage,
      webhookId,
      backupId,
      backupMessageIndex,
      flags,
    });
    if (deleteAfter) {
      actions.push({
        type: FlowActionType.SetVariable,
        varType: FlowActionSetVariableType.Adaptive,
        name: "channelId",
        value: "channel_id",
      });
    }
  }
  if (deleteAfter) {
    actions.push(
      { type: FlowActionType.Wait, seconds: deleteAfter },
      { type: FlowActionType.DeleteMessage },
    );
  }

  return actions;
};

export const welcomerSetupEntry: ChatInputAppCommandCallback<true> = async (
  ctx,
) => {
  const event = ctx.getIntegerOption("event").value as WelcomerTriggerEvent;
  const channel = ctx.getChannelOption("channel") ?? undefined;
  let deleteAfter = ctx.getIntegerOption("delete-after")?.value || undefined;
  if (deleteAfter && deleteAfter < 0) {
    deleteAfter = 0;
  }

  const shareLink = ctx.getStringOption("share-link").value || undefined;
  let shareId: string | undefined;
  if (shareLink) {
    try {
      shareId = await parseShareLink(ctx.env, shareLink);
    } catch (e) {
      return ctx.reply({ content: String(e), flags: MessageFlags.Ephemeral });
    }
  }

  const webhookValue = ctx.getStringOption("webhook").value || undefined;
  let webhook: APIWebhook | undefined;
  if (webhookValue) {
    try {
      webhook = await getWebhook(webhookValue, ctx.env);
    } catch (e) {
      const def = {
        content: String(e),
        flags: MessageFlags.Ephemeral,
      };
      return ctx.reply(
        isDiscordError(e) ? getErrorMessage(ctx, e.rawError)?.data ?? def : def,
      );
    }
    if (!webhook.token) {
      return ctx.reply({
        content:
          "I cannot access that webhook's token. Choose a different webhook or use a channel instead.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const guild = await getchTriggerGuild(
    ctx.rest,
    ctx.env.KV,
    ctx.interaction.guild_id,
  );

  const db = getDb(ctx.env.HYPERDRIVE);
  const addRemove = event === TriggerEvent.MemberAdd ? "add" : "remove";
  const triggers = await getWelcomerConfigurations(
    db,
    addRemove,
    ctx.rest,
    guild,
  );

  const emojis = await getEmojis(ctx.env);
  if (triggers.length > 1) {
    return ctx.reply({
      content: `This server has ${triggers.length} triggers with this event. Please choose which one you would like to modify in the select menu, or [modify the trigger online](${ctx.env.DISCOHOOK_ORIGIN}/s/${ctx.interaction.guild_id}).`,
      flags: MessageFlags.Ephemeral,
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .setComponents(
            new StringSelectMenuBuilder()
              .setCustomId(
                "a_edit-trigger-select_" satisfies AutoComponentCustomId,
              )
              .setOptions(
                triggers.slice(0, 25).map((trigger, i) =>
                  i === 24 && triggers.length > 25
                    ? new StringSelectMenuOptionBuilder()
                        .setLabel("Too many options")
                        .setValue("overflow")
                        .setDescription(
                          "Please visit the link for more options",
                        )
                    : new StringSelectMenuOptionBuilder()
                        .setLabel(`${i + 1}. ${trigger.flow.name}`)
                        .setValue(`${trigger.id}`)
                        .setEmoji(
                          emojis.getC(
                            event === TriggerEvent.MemberAdd
                              ? "User_Add"
                              : "User_Remove",
                            true,
                          ),
                        ),
                ),
              ),
          )
          .toJSON(),
      ],
    });
  }

  let currentFlow: (typeof triggers)[number]["flow"];
  if (triggers.length === 0) {
    currentFlow = {
      id: BigInt(generateId()),
      name: `Welcomer (${addRemove})`,
      actions: [],
    };
  } else {
    currentFlow = triggers[0].flow;
    // Possible shenanigans
    if (currentFlow.id === 0n) {
      currentFlow.id = BigInt(generateId());
    }
  }

  const current = getWelcomerConfigFromActions(
    currentFlow.actions.map((a) => a.data),
  );

  if (deleteAfter === 0) {
    current.deleteAfter = undefined;
  } else if (deleteAfter) {
    current.deleteAfter = deleteAfter;
  }

  if (!current.backupId && !shareId) {
    return ctx.reply({
      content: "Please provide message data with the **share-link** option.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (webhook) {
    current.webhookId = webhook.id;
  } else if (channel) {
    current.channelId = channel.id;
  }
  if (!current.webhookId && !current.channelId) {
    return ctx.reply({
      content:
        "Please select a destination with either the **webhook** or **channel** option.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const user = await upsertDiscordUser(db, ctx.user);

  let backupName: string | undefined;
  if (shareId) {
    const { data } = await getShareLink(ctx.env, shareId);
    current.backupId = generateId();
    backupName = `Welcomer (${addRemove}) - ${guild.name}`.slice(0, 100);
    await db.insert(backups).values({
      id: BigInt(current.backupId),
      ownerId: user.id,
      name: backupName,
      dataVersion: "d2",
      data,
    });
  }

  const actions = buildSimpleWelcomer({
    ...current,
    // biome-ignore lint/style/noNonNullAssertion: Checked above or re-assigned
    backupId: current.backupId!,
  });
  await db.transaction(async (tx) => {
    const flowId = currentFlow.id;
    if (triggers.length === 0) {
      await tx
        .insert(flows)
        .values({ id: flowId, name: currentFlow.name })
        .onConflictDoNothing();
      await tx.insert(dTriggers).values({
        platform: "discord",
        discordGuildId: BigInt(ctx.interaction.guild_id),
        flowId,
        event,
      });
    } else {
      await tx
        .update(dTriggers)
        .set({
          flowId,
          updatedAt: sql`NOW()`,
          updatedById: user.id,
        })
        .where(eq(dTriggers.id, triggers[0].id));
    }
    await tx.delete(flowActions).where(eq(flowActions.flowId, flowId));
    await tx.insert(flowActions).values(
      actions.map((action) => ({
        flowId,
        type: action.type,
        data: action,
      })),
    );
  });

  return ctx.reply({
    embeds: [
      getWelcomerConfigEmbed(ctx.env, current, {
        backup: backupName ? { name: backupName } : undefined,
        webhook,
        emojis,
      })
        .setTitle(currentFlow.name)
        .toJSON(),
    ],
    flags: MessageFlags.Ephemeral,
  });
};
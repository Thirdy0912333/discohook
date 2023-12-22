import { Router } from 'itty-router';
import { PlatformAlgorithm, isValidRequest } from 'discord-verify';
import { AppCommandCallbackT, appCommands, respond } from './commands.js';
import { InteractionType, InteractionResponseType, APIInteraction, APIApplicationCommandInteractionDataOption, ApplicationCommandOptionType, ApplicationCommandType, APIMessageComponentInteraction } from 'discord-api-types/v10'
import { client } from 'discord-api-methods';
import { InteractionContext } from './interactions.js';
import { getErrorMessage } from './errors.js';
import { Env, WorkerContext } from './types/env.js';
import { isDiscordError } from './util/error.js';
import { kvGet } from './util/kv.js';
import { ComponentCallbackT, ComponentRoutingId, MinimumKVComponentState, ModalRoutingId, componentStore, modalStore } from './components.js';

const router = Router();

router.get('/', (_, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

router.post('/', async (request, env: Env, workerCtx: WorkerContext) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  client.setToken(env.DISCORD_TOKEN);

  if (interaction.type === InteractionType.Ping) {
    return respond({ type: InteractionResponseType.Pong });
  }

  if (
    interaction.type === InteractionType.ApplicationCommand ||
    interaction.type === InteractionType.ApplicationCommandAutocomplete
  ) {
    let qualifiedOptions = '';
    if (interaction.data.type === ApplicationCommandType.ChatInput) {
      const appendOption = (option: APIApplicationCommandInteractionDataOption) => {
        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
          qualifiedOptions += ' ' + option.name;
          for (const opt of option.options) {
            appendOption(opt)
          }
        } else if (option.type === ApplicationCommandOptionType.Subcommand) {
          qualifiedOptions += ' ' + option.name;
        }
      }
      for (const option of interaction.data.options ?? []) {
        appendOption(option);
      }
    }

    const appCommand = appCommands[interaction.data.type][interaction.data.name.toLowerCase()];
    if (!appCommand) {
      return respond({ error: 'Unknown command' });
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      const handler = appCommand.handlers[qualifiedOptions.trim() || "BASE"];
      if (!handler) {
        return respond({ error: 'Cannot handle this command' });
      }

      const ctx = new InteractionContext(client, interaction, env);
      try {
        const response = await (handler as AppCommandCallbackT<APIInteraction>)(ctx);
        if (Array.isArray(response)) {
          workerCtx.waitUntil(response[1]());
          return respond(response[0]);
        } else {
          return respond(response);
        }
      } catch (e) {
        if (isDiscordError(e)) {
          const errorResponse = getErrorMessage(ctx, e.raw);
          if (errorResponse) {
            return respond(errorResponse);
          }
        } else {
          console.error(e);
        }
        return respond({ error: "You've found a super unlucky error. Try again later!", status: 500 })
      }
    } else {
      const noChoices = respond({
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: { choices: [] },
      });

      if (!appCommand.autocompleteHandlers) return noChoices;
      const handler = appCommand.autocompleteHandlers[qualifiedOptions.trim() || "BASE"];
      if (!handler) return noChoices;

      const ctx = new InteractionContext(client, interaction, env);
      try {
        const response = await handler(ctx);
        return respond({
          // Normally I wouldn't truncate data at this level but this just
          // makes it a lot easier if the limit is changed in the future,
          // and there's hardly a reason I would *want* to go over the limit
          // in a callback
          type: InteractionResponseType.ApplicationCommandAutocompleteResult,
          data: { choices: response.slice(0, 25) },
        });
      } catch (e) {
        console.error(e);
      }
      return noChoices;
    }
  } else if (interaction.type === InteractionType.MessageComponent) {
    const { custom_id: customId, component_type: type } = interaction.data;
    if (customId.startsWith("t_")) {
      const state = await kvGet<MinimumKVComponentState>(env.KV, `component-${type}-${customId}`);
      if (!state) {
        return respond({ error: "Unknown component" });
      }

      const stored = componentStore[state.componentRoutingId as ComponentRoutingId];
      if (!stored) {
        return respond({ error: 'Unknown routing ID' });
      }

      const ctx = new InteractionContext(client, interaction, env, state);
      try {
        const response = await (stored.handler as ComponentCallbackT<APIMessageComponentInteraction>)(ctx);
        if (state.componentOnce) {
          try { await env.KV.delete(`component-${type}-${customId}`) }
          catch {}
        }
        if (Array.isArray(response)) {
          workerCtx.waitUntil(response[1]());
          return respond(response[0]);
        } else {
          return respond(response);
        }
      } catch (e) {
        if (isDiscordError(e)) {
          const errorResponse = getErrorMessage(ctx, e.raw);
          if (errorResponse) {
            return respond(errorResponse);
          }
        } else {
          console.error(e);
        }
        return respond({ error: "You've found a super unlucky error. Try again later!", status: 500 })
      }
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const { custom_id: customId } = interaction.data;
    if (customId.startsWith("t_")) {
      const state = await kvGet<MinimumKVComponentState>(env.KV, `modal-${customId}`);
      if (!state) {
        return respond({ error: "Unknown modal" });
      }

      const stored = modalStore[state.componentRoutingId as ModalRoutingId];
      if (!stored) {
        return respond({ error: 'Unknown routing ID' });
      }

      const ctx = new InteractionContext(client, interaction, env, state);
      try {
        const response = await stored.handler(ctx);
        if (state.componentOnce) {
          try { await env.KV.delete(`modal-${customId}`) }
          catch {}
        }
        if (Array.isArray(response)) {
          workerCtx.waitUntil(response[1]());
          return respond(response[0]);
        } else {
          return respond(response);
        }
      } catch (e) {
        if (isDiscordError(e)) {
          const errorResponse = getErrorMessage(ctx, e.raw);
          if (errorResponse) {
            return respond(errorResponse);
          }
        } else {
          console.error(e);
        }
        return respond({ error: "You've found a super unlucky error. Try again later!", status: 500 })
      }
    }
  }

  console.error('Unknown Type');
  return respond({ error: 'Unknown Type' });
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request: Request, env: Env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const valid =
    signature &&
    timestamp &&
    (await isValidRequest(request, env.DISCORD_PUBLIC_KEY, PlatformAlgorithm.Cloudflare));
  if (!valid) {
    return { isValid: false };
  }

  const body = await request.json() as APIInteraction;
  return { interaction: body, isValid: true };
}

const server = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async function (request: Request, env: Env, ctx: WorkerContext) {
    return router.handle(request, env, ctx);
  },
};

export default server;
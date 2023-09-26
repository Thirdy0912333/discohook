import { DiscordAPIError } from "@discordjs/rest";
import { APIMessage, APIWebhook } from "discord-api-types/v10";
import { useEffect, useReducer } from "react";
import LocalizedStrings from "react-localization";
import { Button } from "~/components/Button";
import { CoolIcon } from "~/components/CoolIcon";
import { getMessageText } from "~/components/editor/MessageEditor";
import { QueryData } from "~/types/QueryData";
import { MESSAGE_REF_RE } from "~/util/constants";
import { cdn, executeWebhook, updateWebhookMessage } from "~/util/discord";
import { Modal, ModalProps } from "./Modal";

const strings = new LocalizedStrings({
  en: {
    send: "Send",
    sendToAll: "Send to All",
    sendAll: "Send All",
  },
});

const countSelected = (data: Record<string, boolean>) =>
  Object.values(data).filter((v) => v).length;

type SubmitMessageResult =
  | {
      status: "success";
      data: APIMessage;
    }
  | {
      status: "error";
      data: DiscordAPIError;
    };

export const submitMessage = async (
  target: APIWebhook,
  message: QueryData["messages"][number]
): Promise<SubmitMessageResult> => {
  let data;
  if (message.reference) {
    data = await updateWebhookMessage(
      target.id,
      target.token!,
      message.reference.match(MESSAGE_REF_RE)![2],
      {
        content: message.data.content?.trim() || undefined,
        embeds: message.data.embeds || undefined,
      }
    );
  } else {
    data = await executeWebhook(target.id, target.token!, {
      username: message.data.author?.name,
      avatar_url: message.data.author?.icon_url,
      content: message.data.content?.trim() || undefined,
      embeds: message.data.embeds || undefined,
    });
  }
  return {
    status: "code" in data ? "error" : "success",
    data: "code" in data ? (data as unknown as DiscordAPIError) : data,
  } as SubmitMessageResult;
};

export const MessageSendModal = (
  props: ModalProps & {
    targets: Record<string, APIWebhook>;
    setAddingTarget: (open: boolean) => void;
    data: QueryData;
  }
) => {
  const { targets, setAddingTarget, data } = props;

  const [selectedWebhooks, updateSelectedWebhooks] = useReducer(
    (d: Record<string, boolean>, partialD: Record<string, boolean>) => ({
      ...d,
      ...partialD,
    }),
    {}
  );
  useEffect(() => {
    // Set new targets to be enabled by default,
    // but don't affect manually updated ones
    updateSelectedWebhooks(
      Object.keys(targets)
        .filter((targetId) => !Object.keys(selectedWebhooks).includes(targetId))
        .reduce((o, targetId) => ({ ...o, [targetId]: true }), {})
    );
  }, [targets]);

  // Indexed by stringified data.messages index
  type MessagesData = Record<
    string,
    { result?: SubmitMessageResult; enabled: boolean }
  >;
  const [messages, updateMessages] = useReducer(
    (d: MessagesData, partialD: MessagesData) => ({
      ...d,
      ...partialD,
    }),
    {}
  );
  const enabledMessagesCount = Object.values(messages).filter((d) => d.enabled).length
  useEffect(() => {
    // Reset all messages to be enabled by default
    // since the index is not a static identifier
    updateMessages(
      data.messages
        .map((_, i) => i)
        .reduce((o, index) => ({ ...o, [index]: { enabled: true } }), {})
    );
  }, [data.messages]);

  const setOpen = (s: boolean) => {
    props.setOpen(s);
    if (!s) {
      updateMessages(
        Array(10)
          .fill(undefined)
          .map((_, i) => i)
          .reduce(
            (o, index) => ({
              ...o,
              [index]: { result: undefined, enabled: true },
            }),
            {}
          )
      );
    }
  };

  return (
    <Modal
      title={`Send Message${data.messages.length === 1 ? "" : "s"}`}
      {...props}
      setOpen={setOpen}
    >
      <p className="text-sm font-medium">Messages</p>
      <div className="space-y-1">
        {data.messages.length > 0 ? (
          data.messages.map((message, i) => {
            const previewText = getMessageText(message.data);
            return (
              <label
                key={`message-send-${i}`}
                className="flex rounded bg-gray-200 py-2 px-4 w-full cursor-pointer"
              >
                {!!messages[i]?.result && (
                  <CoolIcon
                    icon={
                      messages[i]?.result!.status === "success"
                        ? "Check"
                        : "Close_MD"
                    }
                    className={`text-2xl my-auto mr-1 ${
                      messages[i]?.result!.status === "success"
                        ? "text-green-600"
                        : "text-rose-600"
                    }`}
                  />
                )}
                <div className="my-auto grow text-left">
                  <p className="font-semibold text-base">
                    Message {i + 1}
                    {!!previewText && (
                      <span className="truncate ml-1">- {previewText}</span>
                    )}
                  </p>
                  {messages[i]?.result?.status === "error" && (
                    <p className="text-rose-500 text-sm leading-none">
                      <CoolIcon icon="Circle_Warning" className="mr-1" />
                      {(messages[i].result?.data as DiscordAPIError).message}
                    </p>
                  )}
                </div>
                <input
                  type="checkbox"
                  name="message"
                  checked={messages[i]?.enabled}
                  onChange={(e) =>
                    updateMessages({
                      [i]: { enabled: e.currentTarget.checked },
                    })
                  }
                  hidden
                />
                <CoolIcon
                  icon={
                    messages[i]?.enabled
                      ? "Checkbox_Check"
                      : "Checkbox_Unchecked"
                  }
                  className="ml-auto my-auto text-2xl text-blurple"
                />
              </label>
            );
          })
        ) : (
          <p>You have no messages to send.</p>
        )}
      </div>
      <hr className="border border-gray-400 my-4" />
      <p className="text-sm font-medium">Webhooks</p>
      <div className="space-y-1">
        {Object.keys(targets).length > 0 ? (
          Object.entries(targets).map(([targetId, target]) => {
            return (
              <label
                key={`target-${targetId}`}
                className="flex rounded bg-gray-200 py-2 px-4 w-full cursor-pointer"
              >
                <img
                  src={
                    target.avatar
                      ? cdn.avatar(target.id, target.avatar, { size: 64 })
                      : cdn.defaultAvatar(5)
                  }
                  alt={target.name ?? "Webhook"}
                  className="rounded-full h-12 w-12 mr-2 my-auto"
                />
                <div className="my-auto grow text-left">
                  <p className="font-semibold text-base">
                    {target.name ?? "Webhook"}
                  </p>
                  <p className="text-sm leading-none">
                    Channel ID {target.channel_id}
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="webhook"
                  checked={selectedWebhooks[target.id]}
                  onChange={(e) =>
                    updateSelectedWebhooks({
                      [target.id]: e.currentTarget.checked,
                    })
                  }
                  hidden
                />
                <CoolIcon
                  icon={
                    selectedWebhooks[target.id]
                      ? "Checkbox_Check"
                      : "Checkbox_Unchecked"
                  }
                  className="ml-auto my-auto text-2xl text-blurple"
                />
              </label>
            );
          })
        ) : (
          <div>
            <p>You have no webhooks to send to.</p>
            <Button onClick={() => setAddingTarget(true)}>Add Webhook</Button>
          </div>
        )}
      </div>
      <div className="flex mt-4">
        <div className="mx-auto space-x-2">
          <Button
            disabled={
              countSelected(selectedWebhooks) === 0 ||
              enabledMessagesCount === 0
            }
            onClick={async () => {
              for (const [targetId] of Object.entries(selectedWebhooks).filter(
                ([_, v]) => v
              )) {
                const webhook = targets[targetId];
                for (const [index] of Object.entries(messages).filter(
                  ([_, v]) => v.enabled
                )) {
                  const message = data.messages[Number(index)];
                  const result = await submitMessage(webhook, message);
                  updateMessages({
                    [index]: { result, enabled: true },
                  });
                }
              }
            }}
          >
            {countSelected(selectedWebhooks) <= 1 &&
            enabledMessagesCount > 1
              ? strings.sendAll
              : countSelected(selectedWebhooks) > 1
              ? strings.sendToAll
              : strings.send}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
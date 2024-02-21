import { ReactNode, useState } from "react";
import { CoolIcon } from "./CoolIcon";

export const TextArea = (
  props: React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > & {
    label: ReactNode;
    description?: ReactNode;
    delayOnInput?: number;
    errors?: ReactNode[];
  },
) => {
  const { label, onInput, delayOnInput } = props;

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  // React yells when providing props like this, so we remove it
  const newProps = { ...props };
  delete newProps.delayOnInput;

  return (
    <label className="block">
      <p className="text-sm font-medium flex">
        {label}
        {props.maxLength && (
          <span className="ml-auto">max. {props.maxLength}</span>
        )}
      </p>
      {props.description && <p className="text-sm">{props.description}</p>}
      <textarea
        {...newProps}
        onInput={(e) => {
          // For some reason, currentTarget is only available while processing
          // (i.e. during this callback). We make a shallow copy of the event
          // object here in order to retain it for the provided onInput.
          // https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
          const event = { ...e };

          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(undefined);
          }

          if (onInput && delayOnInput !== undefined) {
            setTimeoutId(
              setTimeout(() => {
                onInput(event);
                setTimeoutId(undefined);
              }, delayOnInput),
            );
          } else if (onInput) {
            return onInput(event);
          }
        }}
        className={`rounded border bg-gray-300 border-gray-200 focus:border-blurple-500 dark:border-transparent dark:bg-[#292b2f] p-2 invalid:border-rose-400 dark:invalid:border-rose-400 transition ${
          props.className ?? ""
        }`}
      />
      {props.errors &&
        props.errors
          .filter((e) => e !== undefined)
          .map((error, i) => (
            <p
              key={`${props.id ?? label}-error-${i}`}
              className="text-rose-500 font-medium mt-1 text-sm"
            >
              <CoolIcon icon="Circle_Warning" className="mr-1.5" />
              {error}
            </p>
          ))}
    </label>
  );
};
import { CoolIcon, CoolIconsGlyph } from "./CoolIcon";

export const InfoBox: React.FC<
  React.PropsWithChildren<{
    icon?: CoolIconsGlyph;
    severity?: "blue" | "yellow" | "red";
    collapsible?: boolean;
    open?: boolean;
  }>
> = ({ icon, children, severity, collapsible, open }) => {
  const colors =
    !severity || severity === "blue"
      ? "bg-blurple-100 border-blurple-200 dark:bg-blurple-300 dark:border-blurple-300 dark:text-black"
      : severity === "yellow"
        ? "bg-yellow-100 border-yellow-200 dark:bg-yellow-300 dark:border-yellow-300 dark:text-black"
        : severity === "red"
          ? "bg-rose-300 border-rose-400 dark:border-rose-300 dark:text-black"
          : "";
  const overlayColors =
    !severity || severity === "blue"
      ? "from-blurple-100 dark:from-blurple-300"
      : severity === "yellow"
        ? "from-yellow-100 dark:from-yellow-300"
        : severity === "red"
          ? "from-rose-300"
          : "";

  return (
    <div
      className={`mb-4 text-sm font-regular p-2 rounded border-2 dark:font-medium select-none ${colors}`}
    >
      {collapsible ? (
        <details className="group/info-box relative" open={open}>
          <summary className="group-open/info-box:mb-2 group-open/info-box:absolute top-0 left-0 group-open/info-box:h-full h-10 group-open/info-box:opacity-0 overflow-hidden transition-[margin] relative marker:content-none marker-none cursor-pointer select-none">
            <CoolIcon
              icon="Chevron_Right"
              className="inline group-open/info-box:hidden"
            />{" "}
            {children}
            <div
              className={`absolute w-full bottom-0 left-0 h-4 bg-gradient-to-t ${overlayColors}`}
            ></div>
          </summary>
          {icon && <CoolIcon icon={icon} />} {children}
        </details>
      ) : (
        <p>
          {icon && <CoolIcon icon={icon} />} {children}
        </p>
      )}
    </div>
  );
};
import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import i18n from "i18next";
import moment from "moment";
import { initReactI18next } from "react-i18next";
import styles from "../styles/app.css";
import { Message } from "./components/preview/Message";
import icons from "./styles/coolicons.css";
import { resources } from "./util/i18n";
import { getZodErrorMessage } from "./util/loader";

export const meta: MetaFunction = () => {
  return [
    { title: "Discohook" },
    {
      name: "description",
      content:
        "Free, intuitive interface for creating webhook messages in your Discord server.",
    },
    {
      property: "og:image",
      content: "logos/discohook_512w.png",
    },
    {
      name: "theme-color",
      content: "#58b9ff",
    },
    // This is here instead of `links` so that it can be overridden by server pages
    {
      tagName: "link",
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
  ];
};

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: icons },
  { rel: "manifest", href: "manifest.json" },
];

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
    format: (value, formatting) => {
      if (value instanceof Date) return moment(value).format(formatting);
      return value.toString();
    },
  },
});

const TailwindThemeScript = () => (
  <script
    // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML
    dangerouslySetInnerHTML={{
      __html: `
    const settings = JSON.parse(localStorage.getItem("discohook_settings") ?? "{}");

    if (
      settings.theme === "light" ||
      (!settings.theme &&
        window.matchMedia("(prefers-color-scheme: light)").matches)
    ) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  `,
    }}
  />
);

export default function App() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <TailwindThemeScript />
      </head>
      <body className="bg-white text-black dark:bg-primary-600 dark:text-primary-230">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Error - Discohook</title>
        <Meta />
        <Links />
        <TailwindThemeScript />
      </head>
      <body className="bg-white text-black dark:bg-primary-600 dark:text-primary-230 h-screen flex">
        <div className="p-8 max-w-3xl mx-auto">
          <Message
            message={{
              content: [
                "You just encountered an error, here's all we know:",
                "```",
                isRouteErrorResponse(error)
                  ? typeof error.data === "object" && "message" in error.data
                    ? getZodErrorMessage(error.data)
                    : String(error.data)
                  : String(error),
                "```",
                "If you think this shouldn't have happened, visit the support server.",
              ].join("\n"),
              components: [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      type: ComponentType.Button,
                      style: ButtonStyle.Link,
                      label: "Support Server",
                      url: "/discord",
                    },
                  ],
                },
              ],
            }}
          />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

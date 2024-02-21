import { Link, useLoaderData } from "@remix-run/react";
import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import React, { useState } from "react";
import { twJoin } from "tailwind-merge";
import { Button } from "~/components/Button";
import { Header } from "~/components/Header";
import { InfoBox } from "~/components/InfoBox";
import { Twemoji } from "~/components/Twemoji";
import { PreviewButton } from "~/components/preview/Components";
import { CryptoDonateInfoModal } from "~/modals/CryptoDonateInfoModal";
import { getUser } from "~/session.server";
import { LoaderArgs } from "~/util/loader";

export const loader = async ({ request, context }: LoaderArgs) => {
  const user = await getUser(request, context);
  const wallets = {
    btc: context.env.BITCOIN_ADDRESS,
  };

  return {
    user,
    wallets,
  };
};

const Cell: React.FC<
  React.PropsWithChildren & {
    className?: string;
    premium?: boolean;
    href?: string;
  }
> = ({ children, className, premium, href }) => (
  <div
    className={twJoin(
      "table-cell text-center p-1 border border-black/10 dark:border-gray-50/10",
      premium ? "bg-sky-200 dark:bg-sky-800/30" : "",
      className ?? "",
    )}
  >
    {href ? (
      <Link to={href} className="text-blurple-400 hover:underline">
        {children}
      </Link>
    ) : (
      children
    )}
  </div>
);

const Feature: React.FC<
  React.PropsWithChildren<{
    id: string;
    title: React.ReactNode;
  }>
> = ({ id, title, children }) => (
  <div
    id={id}
    className="rounded p-2 bg-inherit target:bg-sky-200 dark:target:bg-sky-800/30"
  >
    <p className="font-semibold text-lg">{title}</p>
    {children}
  </div>
);

export default function DonatePage() {
  const { user, wallets } = useLoaderData<typeof loader>();
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [cryptoInfo, setCryptoInfo] = useState<{
    type: string;
    donationKey: string;
  }>();

  return (
    <div>
      <Header user={user} />
      <CryptoDonateInfoModal
        open={cryptoOpen}
        setOpen={setCryptoOpen}
        wallets={wallets}
        {...cryptoInfo}
      />
      <div className="max-w-4xl mx-auto p-4 text-lg">
        <h1 className="text-2xl font-bold">
          <Twemoji emoji="🪩" className="h-6" /> Boogiehook Premium
        </h1>
        <p>
          Thanks for your interest in donating! Your contribution will help keep
          Boogiehook up and running for everyone, and it can earn you some sweet
          perks. Donate at least{" "}
          <span className="font-bold">$4 USD per month</span> to maintain your
          subscription.
          {/* If you donate [x] one time, you can unlock a super-secret lifetime
          subscription. */}
        </p>
        <div className="mt-4 rounded bg-slate-100 dark:bg-gray-700 border border-black/10 dark:border-gray-50/10 table w-full">
          <div className="table-header-group">
            <div className="table-row">
              <Cell className="font-semibold rounded-tl">Feature</Cell>
              <Cell className="font-semibold">Free</Cell>
              <Cell className="font-semibold rounded-tr" premium>
                Premium
              </Cell>
            </div>
          </div>
          <div className="table-row-group">
            <div className="table-row">
              <Cell href="#editor">Full-featured message editor</Cell>
              <Cell>
                <Twemoji emoji="✅" />
              </Cell>
              <Cell premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div>
            <div className="table-row">
              <Cell href="#components">All component types</Cell>
              <Cell>
                <Twemoji emoji="✅" />
              </Cell>
              <Cell premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div>
            <div className="table-row">
              <Cell href="#max-actions">Max. flow actions</Cell>
              <Cell>5</Cell>
              <Cell premium>20</Cell>
            </div>
            <div className="table-row">
              <Cell href="#max-messages">Max. message actions per flow</Cell>
              <Cell>2</Cell>
              <Cell premium>5</Cell>
            </div>
            <div className="table-row">
              <Cell href="#custom-bot">Custom bot profile</Cell>
              <Cell>-</Cell>
              <Cell premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div>
            {/* <div className="table-row">
              <Cell>AMOLED website theme</Cell>
              <Cell>-</Cell>
              <Cell premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div> */}
            <div className="table-row">
              <Cell href="#link-embeds">
                Use-anywhere embeds (+ embedded videos)
              </Cell>
              <Cell>-</Cell>
              <Cell premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div>
            <div className="table-row">
              <Cell href="#hosted-files" className="rounded-bl">
                Hosted image links & files
              </Cell>
              <Cell>-</Cell>
              <Cell className="rounded-br" premium>
                <Twemoji emoji="✅" />
              </Cell>
            </div>
          </div>
        </div>
        <h1 className="text-xl font-bold mt-4">
          <Twemoji emoji="💰" className="h-5" /> How to donate
        </h1>
        <p>
          Most people prefer donating on Ko-fi, since you can use standard
          payment providers (like PayPal) and set up monthly donations.
        </p>
        <div className="flex flex-wrap gap-1">
          <PreviewButton
            data={{
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              url: "https://ko-fi.com/shayypy",
              label: "Ko-fi",
            }}
          />
          <Button
            disabled={!user || !wallets.btc}
            // emoji={{
            //   id: "",
            //   name: "bitcoin",
            // }}
            onClick={async () => {
              if (!cryptoInfo) {
                const r = await fetch("/api/donate/btc", { method: "POST" });
                const d = (await r.json()) as { key: string };
                setCryptoInfo({
                  type: "btc",
                  donationKey: d.key,
                });
              }
              setCryptoOpen(true);
            }}
          >
            Bitcoin
          </Button>
        </div>
        {!user && (
          <div className="mt-2">
            <InfoBox severity="blue">
              Please sign in to donate with cryptocurrencies.
            </InfoBox>
          </div>
        )}
        <h1 className="text-xl font-bold mt-4">
          <Twemoji className="h-5" emoji="✨" /> Features
        </h1>
        <div className="space-y-1">
          <Feature id="editor" title="Full-featured message editor">
            Everyone gets access to the delightful Boogiehook message editor for
            free, including all markdown features and sending functionality.
          </Feature>
          <Feature id="components" title="All component types">
            The Boogiehook bot can be used to add every currently available type
            of component, free of charge - buttons, link buttons, and all select
            menus. But what if you crave more action?
          </Feature>
          <Feature id="max-actions" title="Max. flow actions">
            Free users can have 5 actions per flow - plenty for simple designs,
            but something more advanced could require the massive{" "}
            <Twemoji emoji="💪" /> 20 <Twemoji emoji="💪" /> actions afforded to
            premium users.
          </Feature>
          <Feature id="max-messages" title="Max. message actions per flow">
            Sending messages is a common but limited action, so free users are
            allowed to send 2 messages per flow (as a response or as a webhook),
            and premium users can send up to 5.
          </Feature>
          <Feature id="custom-bot" title="Custom bot profile">
            Use completely custom branding in your server by creating your own
            bot. Read more about how to do this here.
          </Feature>
          <Feature
            id="link-embeds"
            title="Use-anywhere embeds (+ embedded videos)"
          >
            Why limit yourself to the functionality of webhook embeds? Premium
            users can create custom embeds usable anywhere on Discord, even
            without access to a webhook. These embeds can even contain videos
            and up to 4 images. Learn more about link embeds here.
          </Feature>
          <Feature id="hosted-files" title="Hosted image links & files">
            Many users experience difficulty finding a good place to upload
            files that's easy to use and Discord will accept long-term.
          </Feature>
        </div>
      </div>
    </div>
  );
}
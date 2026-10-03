import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import ErrorPage from "./error";

afterEach(cleanup);

describe("error.tsx", () => {
  it.each([
    ["fr", fr],
    ["en", en],
  ])("renders the generic error text for %s", (locale, messages) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ErrorPage reset={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      messages.errors.generic,
    );
  });
});

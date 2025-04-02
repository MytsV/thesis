import type { Preview } from "@storybook/react";
import { Geist, Geist_Mono } from "next/font/google";
import '../src/app/globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const withFonts = (Story) => {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [withFonts],
};

export default preview;
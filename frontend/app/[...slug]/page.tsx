export { default } from "../page";
export const dynamic = "force-static";

export function generateStaticParams() {
  return [
    { slug: ["school"] },
  ];
}

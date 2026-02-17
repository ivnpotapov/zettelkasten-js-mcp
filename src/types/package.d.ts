declare module "../../package.json" {
  export interface PackageJson {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    keywords?: string[];
    homepage?: string;
    repository?: string | { type: string; url: string };
    bugs?: string | { url: string };
    [key: string]: unknown;
  }

  const packageJson: PackageJson;
  export default packageJson;
}

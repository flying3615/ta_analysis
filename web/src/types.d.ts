declare const __BUILDDETAIL__: { buildVersion: string; buildTimestamp: string };

declare interface Window {
  _env_: {
    apiGatewayBaseUrl: string;
    authzBaseUrl: string;
    basemapApiKey: string;
    oidcIssuerUri: string;
    splitKey: string;
    surveyBaseUrl: string;
    secureFileUploadBaseUrl: string;
  };
  isStorybook?: true | undefined;
}

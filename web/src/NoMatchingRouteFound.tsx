import { LuiErrorPage, LuiStaticMessage } from "@linzjs/lui";

export const NoMatchingRouteFound = () => {
  return (
    <LuiErrorPage
      content={
        <LuiStaticMessage level="error" closable={false}>
          <h2>This page does not exist, please check the url and try again.</h2>
        </LuiStaticMessage>
      }
    />
  );
};

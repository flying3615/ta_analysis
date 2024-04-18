import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "@/index.scss";

export const decorators = [
  (Story) => (
    <div style={{height: '95vh'}}>
      <Story/>
    </div>
  ),
];

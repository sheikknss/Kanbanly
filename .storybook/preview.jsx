import "../src/styles.css";
import { StoryProviders } from "../src/stories/StoryProviders";

/** Every story gets the same providers the real app uses. */
const preview = {
  decorators: [(Story) => <StoryProviders><div className="p-4"><Story /></div></StoryProviders>],
  parameters: { layout: "fullscreen" },
};
export default preview;

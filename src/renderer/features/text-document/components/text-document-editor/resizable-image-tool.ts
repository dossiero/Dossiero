import ImageTool from "@editorjs/image";

const DEFAULT_IMAGE_WIDTH = 100;
const MINIMUM_IMAGE_WIDTH = 20;
const KEYBOARD_RESIZE_STEP = 5;

type ImageToolOptions = ConstructorParameters<typeof ImageTool>[0];
type ImageToolData = ReturnType<ImageTool["save"]> & {
  width?: number;
};

function normalizedWidth(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_IMAGE_WIDTH;
  }

  return Math.min(DEFAULT_IMAGE_WIDTH, Math.max(MINIMUM_IMAGE_WIDTH, value));
}

export class ResizableImageTool extends ImageTool {
  private width: number;
  private wrapper: HTMLDivElement | null = null;

  constructor(options: ImageToolOptions) {
    super({
      ...options,
      data: {
        ...options.data,
        caption: "",
        stretched: false,
        withBackground: false,
        withBorder: false,
      },
    });
    this.width = normalizedWidth((options.data as ImageToolData).width);
  }

  render(): HTMLDivElement {
    const wrapper = super.render();
    const imageContainer = wrapper.querySelector<HTMLElement>(".image-tool__image");

    this.wrapper = wrapper;
    wrapper.classList.add("resizable-image-tool");
    wrapper.style.setProperty("--image-width", `${this.width}%`);

    if (imageContainer) {
      imageContainer.append(
        this.createResizeHandle("left"),
        this.createResizeHandle("right"),
      );
    }

    wrapper.addEventListener("click", this.handleImageClick);
    window.document.addEventListener("pointerdown", this.handleOutsidePointerDown);

    return wrapper;
  }

  save(): ImageToolData {
    return {
      ...super.save(),
      caption: "",
      stretched: false,
      withBackground: false,
      withBorder: false,
      width: this.width,
    };
  }

  destroy(): void {
    this.wrapper?.removeEventListener("click", this.handleImageClick);
    window.document.removeEventListener("pointerdown", this.handleOutsidePointerDown);
    this.stopDragging();
  }

  private createResizeHandle(side: "left" | "right"): HTMLButtonElement {
    const handle = window.document.createElement("button");

    handle.type = "button";
    handle.className = `image-resize-handle image-resize-handle--${side}`;
    handle.contentEditable = "false";
    handle.setAttribute("aria-label", `Resize image from the ${side}`);
    handle.addEventListener("pointerdown", (event) => this.startDragging(event, side));
    handle.addEventListener("keydown", (event) => this.handleResizeKey(event, side));

    return handle;
  }

  private readonly handleImageClick = (event: MouseEvent): void => {
    const target = event.target;

    if (target instanceof HTMLImageElement) {
      this.wrapper?.classList.add("resizable-image-tool--selected");
    }
  };

  private readonly handleOutsidePointerDown = (event: PointerEvent): void => {
    const target = event.target;

    if (target instanceof Node && !this.wrapper?.contains(target)) {
      this.wrapper?.classList.remove("resizable-image-tool--selected");
    }
  };

  private startDragging(event: PointerEvent, side: "left" | "right"): void {
    event.preventDefault();
    event.stopPropagation();

    const blockContent = this.wrapper?.closest<HTMLElement>(".ce-block__content");
    const availableWidth = blockContent?.getBoundingClientRect().width ?? 0;

    if (availableWidth <= 0) {
      return;
    }

    const startingX = event.clientX;
    const startingWidth = this.width;
    const direction = side === "right" ? 1 : -1;

    this.wrapper?.classList.add(
      "resizable-image-tool--selected",
      "resizable-image-tool--resizing",
    );

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const horizontalChange = moveEvent.clientX - startingX;
      const percentageChange = (horizontalChange * direction * 2 / availableWidth) * 100;

      this.setWidth(startingWidth + percentageChange);
    };

    const handlePointerUp = (): void => {
      this.stopDragging();
      this.emitChange();
    };

    window.document.addEventListener("pointermove", handlePointerMove);
    window.document.addEventListener("pointerup", handlePointerUp, { once: true });
    this.stopDragging = () => {
      window.document.removeEventListener("pointermove", handlePointerMove);
      window.document.removeEventListener("pointerup", handlePointerUp);
      this.wrapper?.classList.remove("resizable-image-tool--resizing");
      this.stopDragging = () => undefined;
    };
  }

  private handleResizeKey(event: KeyboardEvent, side: "left" | "right"): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const sideDirection = side === "right" ? 1 : -1;

    this.setWidth(this.width + direction * sideDirection * KEYBOARD_RESIZE_STEP);
    this.emitChange();
  }

  private setWidth(width: number): void {
    this.width = Math.round(normalizedWidth(width));
    this.wrapper?.style.setProperty("--image-width", `${this.width}%`);
  }

  private emitChange(): void {
    this.wrapper?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private stopDragging = (): void => undefined;
}

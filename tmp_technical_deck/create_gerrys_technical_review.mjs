import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "C:\\Gerry-docks-final (2)\\Gerry-docks-final\\tmp_technical_deck\\output";
const FINAL_PPTX = "C:\\Gerry-docks-final (2)\\Gerry-docks-final\\Gerrys_Docks_Technical_Review.pptx";

const ASSETS = {
  laptop: "C:\\Gerry-docks-final (2)\\Gerry-docks-final\\presentation-assets\\gerrys-webpage-in-laptop.png",
  site: "C:\\Gerry-docks-final (2)\\Gerry-docks-final\\presentation-assets\\gerrys-current-homepage-chatbot.png",
  acr: "C:\\Users\\kanwa\\AppData\\Local\\Temp\\codex-clipboard-23ddfa4d-da65-4052-9435-c9481b2eb798.png",
  actions: "C:\\Users\\kanwa\\AppData\\Local\\Temp\\codex-clipboard-1bc5412d-56d0-4fe9-9cc9-cd71a4ee9633.png",
  pods: "C:\\Users\\kanwa\\AppData\\Local\\Temp\\codex-clipboard-a2c47176-18e0-4949-90f6-fa762fb148f2.png",
};

const C = {
  navy: "#0B1D33",
  navy2: "#132F4C",
  orange: "#C25E14",
  teal: "#0F766E",
  blue: "#2563EB",
  green: "#15803D",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#D8E1EC",
  pale: "#F5F8FB",
  white: "#FFFFFF",
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function readImageBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addText(slide, text, box, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: box,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 24,
    bold: style.bold ?? false,
    color: style.color ?? C.ink,
    alignment: style.alignment ?? "left",
    ...style,
  };
  return shape;
}

function addBox(slide, box, fill = C.white, lineFill = C.line) {
  return slide.shapes.add({
    geometry: "roundRect",
    position: box,
    fill,
    line: { style: "solid", fill: lineFill, width: 1 },
    borderRadius: "rounded-xl",
  });
}

async function addImage(slide, filePath, box, alt, fit = "cover") {
  slide.images.add({
    blob: await readImageBlob(filePath),
    contentType: "image/png",
    alt,
    fit,
    position: box,
    geometry: "roundRect",
    borderRadius: "rounded-xl",
  });
}

function addFooter(slide, number) {
  addText(slide, "Gerry's Docks technical review", { left: 72, top: 674, width: 360, height: 24 }, {
    fontSize: 13,
    color: C.muted,
  });
  addText(slide, String(number).padStart(2, "0"), { left: 1160, top: 672, width: 48, height: 28 }, {
    fontSize: 16,
    bold: true,
    color: C.muted,
    alignment: "right",
  });
}

function addHeader(slide, eyebrow, title) {
  addText(slide, eyebrow.toUpperCase(), { left: 72, top: 54, width: 340, height: 24 }, {
    fontSize: 13,
    bold: true,
    color: C.orange,
  });
  addText(slide, title, { left: 72, top: 86, width: 920, height: 58 }, {
    fontSize: 38,
    bold: true,
    color: C.ink,
  });
}

function addMiniIcon(slide, label, box, color) {
  slide.shapes.add({
    geometry: "ellipse",
    position: { left: box.left, top: box.top, width: 54, height: 54 },
    fill: color,
    line: { style: "solid", fill: color, width: 1 },
  });
  addText(slide, label, { left: box.left, top: box.top + 9, width: 54, height: 34 }, {
    fontSize: 22,
    bold: true,
    color: C.white,
    alignment: "center",
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, "source-notes.txt"),
    [
      "Local project assets used:",
      ASSETS.laptop,
      ASSETS.site,
      "Local evidence screenshots used:",
      ASSETS.acr,
      ASSETS.actions,
      ASSETS.pods,
    ].join("\n")
  );

  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

  // Slide 1
  {
    const slide = deck.slides.add();
    slide.background.fill = C.pale;
    slide.shapes.add({
      geometry: "rect",
      position: { left: 0, top: 0, width: 1280, height: 720 },
      fill: C.pale,
      line: { style: "solid", fill: C.pale, width: 0 },
    });
    slide.shapes.add({
      geometry: "rect",
      position: { left: 0, top: 0, width: 1280, height: 86 },
      fill: C.navy,
      line: { style: "solid", fill: C.navy, width: 0 },
    });
    addText(slide, "TECHNICAL REVIEW", { left: 72, top: 30, width: 300, height: 28 }, {
      fontSize: 14,
      bold: true,
      color: C.white,
    });
    addText(slide, "Gerry's Docks", { left: 72, top: 154, width: 520, height: 70 }, {
      fontSize: 56,
      bold: true,
      color: C.ink,
    });
    addText(slide, "Live deployed quote management system", { left: 76, top: 230, width: 540, height: 44 }, {
      fontSize: 25,
      color: C.muted,
    });
    addText(slide, "Backend APIs  |  Microservices  |  Azure AKS  |  CI/CD", { left: 76, top: 312, width: 620, height: 36 }, {
      fontSize: 23,
      bold: true,
      color: C.navy2,
    });
    addBox(slide, { left: 76, top: 390, width: 348, height: 68 }, C.white, C.line);
    addText(slide, "Live URL", { left: 102, top: 405, width: 120, height: 22 }, {
      fontSize: 16,
      bold: true,
      color: C.orange,
    });
    addText(slide, "http://20.175.132.45", { left: 102, top: 429, width: 270, height: 26 }, {
      fontSize: 19,
      bold: true,
      color: C.ink,
    });
    await addImage(slide, ASSETS.laptop, { left: 640, top: 128, width: 568, height: 420 }, "Gerry's Docks website shown on a laptop");
    addFooter(slide, 1);
    slide.speakerNotes.textFrame.setText("[Sources]\nLocal project asset: presentation-assets/gerrys-webpage-in-laptop.png\nDeployment URL from project demo context.");
  }

  // Slide 2
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Live path", "Show the best user journey first");
    await addImage(slide, ASSETS.site, { left: 680, top: 152, width: 520, height: 300 }, "Screenshot of Gerry's Docks homepage", "contain");

    const steps = [
      ["1", "Browse", "Catalog + pricing", C.teal],
      ["2", "Request", "Submit quote", C.orange],
      ["3", "Admin", "Login + review", C.blue],
      ["4", "Verify", "Saved data appears", C.green],
    ];
    steps.forEach(([num, title, body, color], index) => {
      const x = 82 + index * 142;
      addMiniIcon(slide, num, { left: x, top: 208 }, color);
      addText(slide, title, { left: x - 12, top: 280, width: 112, height: 30 }, {
        fontSize: 24,
        bold: true,
        color: C.ink,
        alignment: "center",
      });
      addText(slide, body, { left: x - 20, top: 317, width: 132, height: 52 }, {
        fontSize: 17,
        color: C.muted,
        alignment: "center",
      });
      if (index < steps.length - 1) {
        slide.shapes.add({
          geometry: "rect",
          position: { left: x + 67, top: 232, width: 72, height: 3 },
          fill: C.line,
          line: { style: "solid", fill: C.line, width: 0 },
        });
      }
    });

    addBox(slide, { left: 82, top: 440, width: 512, height: 86 }, "#FFF7ED", "#FED7AA");
    addText(slide, "Presenter cue", { left: 108, top: 456, width: 160, height: 24 }, {
      fontSize: 17,
      bold: true,
      color: C.orange,
    });
    addText(slide, "Use keyboard shortcuts while moving through the live site.", { left: 108, top: 485, width: 440, height: 30 }, {
      fontSize: 21,
      color: C.ink,
    });
    addFooter(slide, 2);
    slide.speakerNotes.textFrame.setText("[Sources]\nLocal project asset: presentation-assets/gerrys-current-homepage-chatbot.png");
  }

  // Slide 3
  {
    const slide = deck.slides.add();
    slide.background.fill = C.pale;
    addHeader(slide, "Backend", "Frontend actions map to API services");
    const columns = [
      ["Frontend action", "Catalog loads\nQuote submitted\nAdmin logs in\nProduct changed\nQuotes reviewed"],
      ["API route", "GET /api/products\nPOST /api/quotes\nPOST /api/admin/login\nPOST/PUT/DELETE /api/products\nGET /api/quotes"],
      ["Service", "product-service\nquote-service\nadmin-service\nproduct-service\nquote-service"],
    ];
    columns.forEach(([heading, lines], i) => {
      const x = 92 + i * 370;
      addBox(slide, { left: x, top: 178, width: 318, height: 360 }, C.white, C.line);
      slide.shapes.add({
        geometry: "rect",
        position: { left: x, top: 178, width: 318, height: 10 },
        fill: i === 0 ? C.teal : i === 1 ? C.orange : C.blue,
        line: { style: "solid", fill: "none", width: 0 },
      });
      addText(slide, heading, { left: x + 28, top: 214, width: 260, height: 34 }, {
        fontSize: 25,
        bold: true,
        color: C.ink,
      });
      addText(slide, lines, { left: x + 30, top: 274, width: 258, height: 220 }, {
        fontSize: 21,
        color: C.muted,
      });
    });
    addText(slide, "Protected admin actions require a JWT token before database changes are allowed.", { left: 152, top: 584, width: 980, height: 36 }, {
      fontSize: 24,
      bold: true,
      color: C.navy,
      alignment: "center",
    });
    addFooter(slide, 3);
    slide.speakerNotes.textFrame.setText("[Sources]\nLocal code mapping from frontend src pages and services routes.");
  }

  // Slide 4
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Cloud", "Deployment evidence is visible in Azure");
    await addImage(slide, ASSETS.acr, { left: 72, top: 160, width: 350, height: 265 }, "Azure Container Registry repositories screenshot", "cover");
    await addImage(slide, ASSETS.pods, { left: 465, top: 160, width: 350, height: 265 }, "Kubernetes pods running screenshot", "cover");
    await addImage(slide, ASSETS.actions, { left: 858, top: 160, width: 350, height: 265 }, "GitHub Actions successful workflow screenshot", "cover");
    const labels = [
      ["ACR images", 72, C.orange],
      ["AKS pods", 465, C.green],
      ["CI/CD run", 858, C.blue],
    ];
    labels.forEach(([text, x, color]) => {
      addText(slide, text, { left: x, top: 444, width: 350, height: 34 }, {
        fontSize: 25,
        bold: true,
        color,
        alignment: "center",
      });
    });
    addText(slide, "GitHub push  →  Docker build  →  Azure Container Registry  →  Azure Kubernetes Service", { left: 128, top: 536, width: 1024, height: 40 }, {
      fontSize: 26,
      bold: true,
      color: C.ink,
      alignment: "center",
    });
    addFooter(slide, 4);
    slide.speakerNotes.textFrame.setText("[Sources]\nLocal evidence screenshots: ACR repositories, kubectl pods, GitHub Actions workflow.");
  }

  // Slide 5
  {
    const slide = deck.slides.add();
    slide.background.fill = C.navy;
    addText(slide, "READY FOR CLIENT SUBMISSION", { left: 72, top: 58, width: 600, height: 28 }, {
      fontSize: 15,
      bold: true,
      color: "#FBBF24",
    });
    addText(slide, "What the demo proves", { left: 72, top: 110, width: 700, height: 62 }, {
      fontSize: 44,
      bold: true,
      color: C.white,
    });
    const proofs = [
      ["Deployed", "Live cloud-hosted website", C.teal],
      ["Integrated", "Frontend, APIs, database, AI", C.orange],
      ["Automated", "Docker + AKS + GitHub Actions", C.blue],
    ];
    proofs.forEach(([h, b, color], i) => {
      const x = 92 + i * 378;
      addBox(slide, { left: x, top: 240, width: 320, height: 150 }, "#102A46", "#254866");
      slide.shapes.add({
        geometry: "ellipse",
        position: { left: x + 30, top: 282, width: 38, height: 38 },
        fill: color,
        line: { style: "solid", fill: color, width: 0 },
      });
      addText(slide, h, { left: x + 86, top: 270, width: 200, height: 34 }, {
        fontSize: 26,
        bold: true,
        color: C.white,
      });
      addText(slide, b, { left: x + 86, top: 310, width: 200, height: 52 }, {
        fontSize: 18,
        color: "#CBD5E1",
      });
    });

    addText(slide, "Contribution focus", { left: 104, top: 476, width: 260, height: 30 }, {
      fontSize: 24,
      bold: true,
      color: C.white,
    });
    addText(slide, "Kanwar: backend, microservices, Azure, CI/CD\nMoin: frontend UX\nDavinderdeep: database\nSimranjit: AI assistant + support", { left: 104, top: 518, width: 900, height: 96 }, {
      fontSize: 22,
      color: "#E2E8F0",
    });
    addFooter(slide, 5);
    slide.speakerNotes.textFrame.setText("[Sources]\nTeam role summary from project discussion.");
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(OUT_DIR, `${stem}.png`), await deck.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(OUT_DIR, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(path.join(OUT_DIR, "deck-montage.webp"), await deck.export({ format: "webp", montage: true, scale: 1 }));

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

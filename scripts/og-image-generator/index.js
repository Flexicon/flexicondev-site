/**
 * OG Image Wizard 🧙
 *
 * Generates an OG image screenshot from HTML using Puppeteer.
 */

import { launch } from "puppeteer";
import { existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OG Image</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1200px;
      height: 630px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: 'Courier New', monospace;
      overflow: hidden;
    }
    
    .terminal {
      width: 1000px;
      background: #1e293b;
      border: 2px solid #475569;
      border-radius: 12px;
      padding: 40px 50px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .terminal-header {
      display: flex;
      gap: 8px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }
    
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
    }
    
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }
    
    .line {
      margin-bottom: 20px;
      font-size: 24px;
      line-height: 1.6;
    }
    
    .prompt {
      color: #22d3ee;
      margin-right: 10px;
    }
    
    .command {
      color: #a78bfa;
    }
    
    .output {
      color: #e2e8f0;
      margin-left: 40px;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    
    .output.large {
      font-size: 36px;
      font-weight: bold;
      color: #f0f9ff;
      margin-bottom: 15px;
    }
    
    .output.muted {
      color: #94a3b8;
    }
    
    .interests {
      display: flex;
      gap: 20px;
      margin-left: 40px;
      margin-top: 8px;
    }
    
    .interest {
      color: #60a5fa;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      color: #22d3ee;
      font-size: 28px;
      text-align: center;
    }
    
    .cursor {
      display: inline-block;
      width: 12px;
      height: 28px;
      background: #22d3ee;
      margin-left: 5px;
    }
  </style>
</head>
<body>
  <div class="terminal">
    <div class="terminal-header">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
    </div>
    
    <div class="line">
      <span class="prompt">$</span>
      <span class="command">whoami</span>
    </div>
    <div class="output large">Mike Repeć</div>
    
    <div class="line">
      <span class="prompt">$</span>
      <span class="command">cat role.txt</span>
    </div>
    <div class="output">Engineering Manager @ ClickUp</div>
    
    <div class="line">
      <span class="prompt">$</span>
      <span class="command">ls interests/</span>
    </div>
    <div class="interests">
      <span class="interest">web-tech/</span>
      <span class="interest">speedcubing/</span>
      <span class="interest">oss/</span>
    </div>
    
    <div class="line" style="margin-top: 30px;">
      <span class="prompt">$</span>
      <span class="cursor"></span>
    </div>
    
    <div class="footer">flexicon.dev</div>
  </div>
</body>
</html>
`;

async function generateOGImage() {
  console.log("🚀 Launching browser...");

  const browser = await launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to exact OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2, // 2x for retina/high-DPI displays
    });

    console.log("📄 Loading HTML template...");
    await page.setContent(HTML_TEMPLATE, {
      waitUntil: "networkidle0",
    });

    // Ensure output directory exists
    const outputDir = join(process.cwd(), "..", "..", "static");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, "og-image.png");

    console.log("📸 Taking screenshot...");
    await page.screenshot({
      path: outputPath,
      type: "png",
      omitBackground: false,
    });

    console.log(`✅ OG image generated successfully: ${outputPath}`);
    console.log(
      `📦 File size: ${(statSync(outputPath).size / 1024).toFixed(2)} KB`,
    );
  } catch (error) {
    console.error("❌ Error generating OG image:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the generator
generateOGImage().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

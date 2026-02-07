const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} = require("docx");
const fs = require("fs");
const path = require("path");

// 마크다운 파싱 함수
function parseMarkdown(content) {
  const lines = content.split("\n");
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 빈 줄
    if (line.trim() === "") {
      if (inTable && tableRows.length > 0) {
        elements.push({ type: "table", headers: tableHeaders, rows: tableRows });
        tableRows = [];
        tableHeaders = [];
        inTable = false;
      }
      continue;
    }

    // 구분선 (---)
    if (line.trim() === "---") {
      continue;
    }

    // 테이블 구분자 (|---|---|)
    if (line.match(/^\|[-:\s|]+\|$/)) {
      continue;
    }

    // 테이블 행
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .split("|")
        .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((cell) => cell.trim());

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    }

    // 테이블 종료
    if (inTable && tableRows.length > 0) {
      elements.push({ type: "table", headers: tableHeaders, rows: tableRows });
      tableRows = [];
      tableHeaders = [];
      inTable = false;
    }

    // 제목 (# ~ ####)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      elements.push({ type: "heading", level, text });
      continue;
    }

    // 리스트 항목
    if (line.match(/^[-*]\s+/)) {
      const text = line.replace(/^[-*]\s+/, "");
      elements.push({ type: "list", text });
      continue;
    }

    // 번호 리스트
    if (line.match(/^\d+\.\s+/)) {
      const text = line.replace(/^\d+\.\s+/, "");
      elements.push({ type: "numberedList", text });
      continue;
    }

    // 일반 텍스트
    elements.push({ type: "paragraph", text: line });
  }

  // 마지막 테이블 처리
  if (inTable && tableRows.length > 0) {
    elements.push({ type: "table", headers: tableHeaders, rows: tableRows });
  }

  return elements;
}

// 텍스트에서 볼드/이탤릭 파싱
function parseInlineFormatting(text) {
  const runs = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 볼드 (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index === 0) {
      runs.push(new TextRun({ text: boldMatch[1], bold: true }));
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 이탤릭 (*text*)
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index === 0) {
      runs.push(new TextRun({ text: italicMatch[1], italics: true }));
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 볼드가 중간에 있는 경우
    if (boldMatch) {
      runs.push(new TextRun({ text: remaining.slice(0, boldMatch.index) }));
      runs.push(new TextRun({ text: boldMatch[1], bold: true }));
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // 이탤릭이 중간에 있는 경우
    if (italicMatch) {
      runs.push(new TextRun({ text: remaining.slice(0, italicMatch.index) }));
      runs.push(new TextRun({ text: italicMatch[1], italics: true }));
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // 일반 텍스트
    runs.push(new TextRun({ text: remaining }));
    break;
  }

  return runs;
}

// DOCX 문서 생성
function createDocx(elements, title) {
  const children = [];

  // 문서 제목
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  for (const element of elements) {
    switch (element.type) {
      case "heading":
        const headingLevels = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
        };
        children.push(
          new Paragraph({
            text: element.text,
            heading: headingLevels[element.level] || HeadingLevel.HEADING_4,
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case "paragraph":
        children.push(
          new Paragraph({
            children: parseInlineFormatting(element.text),
            spacing: { after: 120 },
          })
        );
        break;

      case "list":
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              ...parseInlineFormatting(element.text),
            ],
            spacing: { after: 60 },
            indent: { left: 720 },
          })
        );
        break;

      case "numberedList":
        children.push(
          new Paragraph({
            children: parseInlineFormatting(element.text),
            spacing: { after: 60 },
            indent: { left: 720 },
          })
        );
        break;

      case "table":
        const tableRows = [];

        // 헤더 행
        tableRows.push(
          new TableRow({
            children: element.headers.map(
              (header) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: header, bold: true })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: { fill: "E0E0E0" },
                })
            ),
          })
        );

        // 데이터 행
        for (const row of element.rows) {
          tableRows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: parseInlineFormatting(cell),
                      }),
                    ],
                  })
              ),
            })
          );
        }

        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        break;
    }
  }

  return new Document({
    sections: [{ children }],
  });
}

async function convertFile(inputPath, outputPath, title) {
  console.log(`Converting: ${inputPath}`);
  const content = fs.readFileSync(inputPath, "utf-8");
  const elements = parseMarkdown(content);
  const doc = createDocx(elements, title);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${outputPath}`);
}

async function main() {
  const docsDir = path.join(__dirname, "..", "docs");

  // 일반 사업계획서
  await convertFile(
    path.join(docsDir, "사업계획서_일반_초안.md"),
    path.join(docsDir, "사업계획서_일반_초안.docx"),
    "무대장비 대여 플랫폼 사업계획서"
  );

  // 초기창업패키지 사업계획서
  await convertFile(
    path.join(docsDir, "초기창업패키지_사업계획서_PSST.md"),
    path.join(docsDir, "초기창업패키지_사업계획서_PSST.docx"),
    "초기창업패키지 사업계획서 (PSST)"
  );

  console.log("\n✅ 변환 완료!");
}

main().catch(console.error);

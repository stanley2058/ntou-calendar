import * as fs from "fs";
import fetch from "node-fetch";
import * as HTMLParser from "node-html-parser";

function getSemester() {
  const year = parseInt(
    new Date(new Date().getTime() + 3600000 * 8).toISOString().split("-")[0]
  );
  const month = parseInt(
    new Date(new Date().getTime() + 3600000 * 8).toISOString().split("-")[1]
  );
  const semester = (year - 1911 - (month >= 8 ? 0 : 1)).toString();
  return semester;
}

async function fetchCalendar() {
  const academicUrl = "https://academic.ntou.edu.tw";
  const outputJsonPath = "calendar.json";
  const semester = getSemester();

  const indexRes = await fetch(academicUrl).then((res) => res.text());
  const indexHtml = HTMLParser.parse(indexRes);
  let calendarUrlDom = null;
  if (indexHtml) {
    calendarUrlDom = [...indexHtml.querySelectorAll("a")].filter(
      (ele) => ele.getAttribute("title") === "校園行事曆"
    )[0];
  }

  if (calendarUrlDom) {
    const url = academicUrl + calendarUrlDom.getAttribute("href");
    const calendarRes = await fetch(url).then((res) => res.text());
    const calendarHTML = HTMLParser.parse(calendarRes);
    const calendarDom = calendarHTML
      .querySelectorAll("a")
      .filter(
        (a) =>
          a.getAttribute("title") &&
          a.getAttribute("title")?.includes("行事曆") &&
          a.getAttribute("title")?.includes(semester)
      )[0];

    if (calendarDom) {
      const uri = calendarDom.getAttribute("href")?.includes(academicUrl)
        ? calendarDom.getAttribute("href")
        : academicUrl + calendarDom.getAttribute("href");

      if (fs.existsSync(outputJsonPath)) fs.unlinkSync(outputJsonPath);
      fs.writeFileSync(outputJsonPath, JSON.stringify({ semester, uri }));
    } else throw new Error("cannot parse calendar");
  } else throw new Error("cannot parse index");
}

fetchCalendar();

import { translate } from "@vitalets/google-translate-api"

const isThai = (text) => /[\u0e00-\u0e7f]/.test(text)

export const translateToEng = async (keyword) => {
  if (!isThai(keyword)) return keyword.toLowerCase().trim()
  try {
    const { text } = await translate(keyword, { to: "en" })
    const translated = text.toLowerCase().trim()
    // เอาแค่คำแรกถ้ายาวเกิน
    return translated.split(" ").length > 3 ? translated.split(" ")[0] : translated
  } catch {
    return keyword // คืนค่าเดิมถ้าแปลไม่ได้
  }
}
// คอร์สเดียวกันมักมีหลายเวอร์ชันตามจำนวนชั่วโมง เช่น "... (ชั่วโมงการเรียนรู้ 2 ชั่วโมง)"
// key นี้ตัดส่วนนั้นออก เพื่อใช้ตัดคอร์สซ้ำในผลแนะนำ/ค้นหา
export const courseGroupKey = (title = "") =>
  title
    .toLowerCase()
    .replace(/\(\s*ชั่วโมงการเรียนรู้[^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()

// เก็บเฉพาะรายการแรกของแต่ละ key (รักษาลำดับเดิม) และข้าม key ที่อยู่ใน `exclude`
export const dedupeCourses = (courses, exclude = []) => {
  const taken = new Set(exclude)
  return courses.filter((c) => {
    const key = courseGroupKey(c.title)
    if (taken.has(key)) return false
    taken.add(key)
    return true
  })
}

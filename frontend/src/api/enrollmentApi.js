import api from "./api";

export const enrollCourse = async (courseId) => {
  const res = await api.post("/enrollments", { courseId });
  return res.data;
};

export const getMyCoursesAPI = async () => {
  const res = await api.get("/enrollments/my-courses");
  return res.data;
};
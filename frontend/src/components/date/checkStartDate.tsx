const checkStartDate = (
  dateString: string | Date,
  dateString2: string | Date
): number => {
  const date1 = new Date(dateString);
  const date2 = new Date(dateString2);
  const msDiff = date1.getTime() - date2.getTime();
  return Math.ceil(msDiff / (1000 * 60 * 60 * 24));
};

export default checkStartDate;

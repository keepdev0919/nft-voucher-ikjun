const getDateDiff = (
  dateString: string | Date,
  dateString2: string | Date
): number | string | undefined => {
  const date1 = new Date(dateString);
  const date2 = new Date(dateString2);
  const msDiff = date1.getTime() - date2.getTime();
  if (Math.ceil(msDiff / (1000 * 60 * 60 * 24)) >= 0) {
    return "-" + Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  } else if (Math.ceil(msDiff / (1000 * 60 * 60 * 24)) < 0) {
    return "+" + -Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  }
};

export default getDateDiff;

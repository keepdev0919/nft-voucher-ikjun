const checkEndDate = (
  dateString: string | Date,
  dateString2: string | Date
): boolean | undefined => {
  const date1 = new Date(dateString);
  const date2 = new Date(dateString2);
  const msDiff = date1.getTime() - date2.getTime();
  if (Math.floor(msDiff / (1000 * 60 * 60 * 24)) >= 1) {
    return true;
  } else if (Math.ceil(msDiff / (1000 * 60 * 60 * 24)) < 1) {
    return false;
  }
};

export default checkEndDate;

const formatDate = (dt: Date): string => {
  const y = dt.getFullYear();
  const m = ("0" + (dt.getMonth() + 1)).slice(-2);
  const d = ("0" + dt.getDate()).slice(-2);
  return y + "-" + m + "-" + d;
};

export default formatDate;

function alphaNumSort(a, b) {
  const nameA = a.querySelector(selectorStr).innerHTML;
  const nameB = b.querySelector(selectorStr).innerHTML;
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}


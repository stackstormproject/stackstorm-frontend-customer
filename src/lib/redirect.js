/** Leaves the shop for an external page (the payment gateway). Kept apart so tests can stub it. */
export const leaveFor = (href) => {
  window.location.assign(href);
};

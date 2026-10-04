// Site settings. Edit and redeploy; no build step needed.
window.CONNECT_CONFIG = {
  ads: {
    // Show a "Sponsored" slot after every N posts. 0 turns in-feed slots off.
    every: 6,
    // Fill an in-feed slot. Paste your Monetag banner/native zone code into this function,
    // e.g. create its <script> element and append it to `slot`. While this is null, no
    // in-feed slots are shown. Site-wide tags (popunder etc.) go in index.html <head>.
    renderSlot: null,
  },
};

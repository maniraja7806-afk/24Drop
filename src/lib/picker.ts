export function loadPickerApi(callback: () => void) {
  const win = window as any;
  if (win.google && win.google.picker) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    win.gapi.load('picker', { callback });
  };
  document.body.appendChild(script);
}

export function openPicker(accessToken: string, onPicked: (file: any) => void) {
  const win = window as any;
  const pickerOrigin =
    window.location.ancestorOrigins &&
    window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[
          window.location.ancestorOrigins.length - 1
        ]
      : window.location.origin;

  const picker = new win.google.picker.PickerBuilder()
    .addView(win.google.picker.ViewId.DOCS)
    .setOAuthToken(accessToken)
    .setCallback((data: any) => {
      if (data.action === win.google.picker.Action.PICKED) {
        onPicked(data.docs[0]);
      }
    })
    .setOrigin(pickerOrigin)
    .build();
  picker.setVisible(true);
}

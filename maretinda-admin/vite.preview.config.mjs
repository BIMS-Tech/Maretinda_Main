// Production preview-server config for Cloud Run.
// `vite preview` enforces a Host header allow-list (Vite 5.4.12+ security fix).
// Behind Cloud Run's managed HTTPS front end the Host is the *.run.app (or
// custom) domain, which isn't known at build time, so allow all hosts here.
export default {
  preview: {
    allowedHosts: true,
  },
};

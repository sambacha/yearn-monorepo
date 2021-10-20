load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-alpha.22.tgz",
  strip_prefix = "package",
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "12.16.1",
  node_sha256 = {
    "mac": "",
    "linux": "",
    "windows": "",
  },
  yarn_version = "1.22.0",
  yarn_sha256 = "",
)

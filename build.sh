#!/bin/bash

shopt -s extdebug
shopt -s inherit_errexit
set -e

. build-scripts/loader-extended.bash

loader_addpath build-scripts/

# shellcheck source=build-scripts/libmain.sh
include libmain.sh
# shellcheck source=build-scripts/libbuild.sh
include libbuild.sh
# shellcheck source=build-scripts/libdefer.sh
include libdefer.sh

function main() {
  local stage="${1-all}"

  libmain_init gpfjs gpfjs
  libmain_init_build_env seqpipe-containers
  libmain_save_build_env_on_exit
  libbuild_init "$stage" registry.seqpipe.org

  defer_ret build_run_ctx_reset_all_persistent
  defer_err build_run_ctx_reset_all_persistent
  defer_err build_run_ctx_reset

  local node_base_image_ref
  node_base_image_ref="$(e docker_img_seqpipe_node_base)"
  build_run_init "container" "$node_base_image_ref"
  defer_ret build_run_reset

  build_stage "Clean and fetch fresh dependencies"
  {
    build_run rm -rf node_modules package-lock.json
    build_run npm install
  }

  build_stage "Lint"
  {
    build_run ng lint --format checkstyle >ts-lint-report.xml || echo "tslint exited with $?"
    build_run sed -i '$ d' ts-lint-report.xml
  }

  build_stage "Tests"
  {
    build_run ng test -- --no-watch --no-progress --code-coverage --browsers=ChromeHeadlessCI || true
  }

  build_stage "Clean and package"
  {
    build_run rm -rf dist/
    build_run ng build --prod --aot --configuration 'default' --base-href '/gpf_prefix/' --deploy-url '/gpf_prefix/'
  }

}

main "$@"

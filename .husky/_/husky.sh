#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ "$exitCode" != 0 ]; then
    echo "husky - $0 script failed (code $exitCode)"
  fi

  exit "$exitCode"
fi
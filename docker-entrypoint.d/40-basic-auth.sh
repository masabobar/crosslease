#!/bin/sh
# Gate the SPA behind HTTP Basic auth when credentials are supplied.
#
# Runs from /docker-entrypoint.d/ before nginx starts, so the credentials come
# from the environment at boot and are never baked into the image. The output
# file is included by the server block in nginx.conf.template; writing an inert
# comment when no credentials are set is what makes the gate optional.
set -eu

CONF=/etc/nginx/basic-auth.conf
HTPASSWD=/etc/nginx/.htpasswd

if [ -z "${BASIC_AUTH_USER:-}" ] || [ -z "${BASIC_AUTH_PASSWORD:-}" ]; then
  echo "# basic auth disabled (BASIC_AUTH_USER / BASIC_AUTH_PASSWORD unset)" >"$CONF"
  echo "40-basic-auth.sh: no credentials supplied, site is public"
  exit 0
fi

# -m forces the Apache MD5 (apr1) hash. nginx implements apr1 itself rather
# than delegating to the platform crypt(), so it verifies identically on any
# base image — unlike bcrypt, which depends on the libc in use.
htpasswd -bcm "$HTPASSWD" "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD" 2>/dev/null

# The worker processes read this file per request as the nginx user, while this
# script runs as root — without the group it is a 500 on every gated request.
chown root:nginx "$HTPASSWD"
chmod 640 "$HTPASSWD"

cat >"$CONF" <<EOF
auth_basic           "${BASIC_AUTH_REALM:-Restricted}";
auth_basic_user_file $HTPASSWD;
EOF

echo "40-basic-auth.sh: basic auth enabled for user '$BASIC_AUTH_USER'"

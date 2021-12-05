#! /usr/bin/env xonsh
import sys
sys.path.insert(0, '')


from buildscripts.lib import wo, wc

cd './_includes/resources/linux_keyring'
$(mkdir -p o)

wc("00_keyctl_show.txt", "keyctl show")

wc("01_keyctl_describe.txt", "keyctl describe '@s'", "keyctl rdescribe '@s'")

wc("02_proc_keys.txt", "cat /proc/keys")

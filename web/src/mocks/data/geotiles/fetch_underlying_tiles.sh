#!/bin/bash

# Fetches underlying mark or parcel tiles from geoserver for a selected area
# Author: Richard Parratt <RParratt@linz.govt.nz>

set -e
target_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Select below the type of underlying tile you want
tileType='viw_parcel_all'
# tileType='underlying_marks'

# Select a geoserver
baseUrl='http://localhost:12065/plan-generation/v1/generate-plans/tiles'

# specify the range of tiles you want in
# Web Map Tile Service (WMTS) tile coordinates
# https://www.ogc.org/standard/wmts/
topZoom=17
zoomEnd=18
xStart=129188
xEnd=129191
yStart=48992
yEnd=48994

yZStart=$yStart
yZEnd=$yEnd
xZStart=$xStart
xZEnd=$xEnd

# z is zoom factor, each zoom in doubles the length/width of a tile
# y is tiles S of the reference latitude 85.0511 N
# x is tiles E of the meridian
for (( z=$topZoom; z<=$zoomEnd; z++)); do
  for (( y=$yZStart; y<=$yZEnd; y++)); do
    for (( x=$xZStart; x<=$xZEnd; x++)); do
      url=$baseUrl/$tileType/$z/$x/$y
      echo "fetching from: $url"

      curl --create-dirs -O --output-dir $target_dir/$tileType/$z/$x $url --fail \
        -H 'authorization: Bearer XYZ' # Replace XYZ with your bearer token
    done
  done

  yZStart=$((yZStart * 2))
  yZEnd=$((yZEnd * 2))
  xZStart=$((xZStart * 2))
  xZEnd=$((xZEnd * 2))
done

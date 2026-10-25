// Move a position that crossed a map edge to the opposite side, keeping the distance it went past the edge
// (so a moving thing makes one continuous stride instead of losing up to a frame of travel). Mutates pos;
// returns the {dx, dy} it moved, which is always the map size or zero.
export function wrapToMap(pos, map) {
    const width = map.maxX - map.minX
    const height = map.maxY - map.minY
    let dx = 0
    let dy = 0
    if (pos.x > map.maxX) dx = -width
    else if (pos.x < map.minX) dx = width
    if (pos.y > map.maxY) dy = -height
    else if (pos.y < map.minY) dy = height
    pos.x += dx
    pos.y += dy
    return { dx, dy }
}

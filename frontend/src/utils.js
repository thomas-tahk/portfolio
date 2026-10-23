// Teleport a position that crossed a map edge to the opposite edge. Mutates pos; returns the {dx, dy} it moved.
export function wrapToMap(pos, map) {
    const before = { x: pos.x, y: pos.y }
    if (pos.x > map.maxX) pos.x = map.minX
    else if (pos.x < map.minX) pos.x = map.maxX
    if (pos.y > map.maxY) pos.y = map.minY
    else if (pos.y < map.minY) pos.y = map.maxY
    return { dx: pos.x - before.x, dy: pos.y - before.y }
}

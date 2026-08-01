"""Minimal PNG writer used by the seed command to create demo artwork.

The template ships no binary assets, so the seed generates its own gradient images
in the store's palette. That keeps demo media real (files on disk, MediaAsset rows,
working URLs) without committing images to the repository or fetching anything from
the network.
"""

from __future__ import annotations

import struct
import zlib

RGB = tuple[int, int, int]


def hex_to_rgb(value: str) -> RGB:
    value = value.lstrip("#")
    if len(value) == 3:
        value = "".join(c * 2 for c in value)
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def gradient_png(width: int, height: int, start: RGB, end: RGB) -> bytes:
    """A diagonal two-stop gradient, encoded as a truecolour 8-bit PNG."""
    rows = bytearray()
    denominator = max(1, (width - 1) * 4 + (height - 1) * 6)
    for y in range(height):
        rows.append(0)  # filter type: none
        for x in range(width):
            t = (x * 4 + y * 6) / denominator
            rows.extend(round(start[i] + (end[i] - start[i]) * t) for i in range(3))

    signature = b"\x89PNG\r\n\x1a\n"
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        signature
        + _chunk(b"IHDR", header)
        + _chunk(b"IDAT", zlib.compress(bytes(rows), 6))
        + _chunk(b"IEND", b"")
    )

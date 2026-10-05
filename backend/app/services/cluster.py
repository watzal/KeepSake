"""Group photos into moments: HDBSCAN on CLIP embeddings plus shooting time."""
from datetime import datetime

import numpy as np
from sklearn.cluster import HDBSCAN

MIN_CLUSTER_SIZE = 3
TIME_WEIGHT = 0.15  # distance added per hour apart; unrelated scenes sit ~0.7-1.0 apart in CLIP space
REPRESENTATIVES = 4


def _time_feature(times: list[datetime | None]) -> np.ndarray | None:
    known = [t.timestamp() for t in times if t is not None]
    if not known:
        return None
    # photos without EXIF time sit at the median so time does not pull them anywhere
    fill = float(np.median(known))
    seconds = np.array([t.timestamp() if t is not None else fill for t in times])
    return ((seconds - seconds.min()) / 3600 * TIME_WEIGHT).reshape(-1, 1)


def cluster_photos(embeddings: np.ndarray, times: list[datetime | None]) -> np.ndarray:
    """Returns a cluster label (0..k-1) for every photo. No photo is left out."""
    n = len(embeddings)
    if n < 2 * MIN_CLUSTER_SIZE:
        return np.zeros(n, dtype=int)

    features = embeddings
    time = _time_feature(times)
    if time is not None:
        features = np.hstack([embeddings, time])

    labels = HDBSCAN(min_cluster_size=MIN_CLUSTER_SIZE, min_samples=2).fit_predict(features)
    found = sorted(set(labels.tolist()) - {-1})
    if not found:
        return np.zeros(n, dtype=int)

    # fold leftover noise photos into the nearest cluster
    centres = np.vstack([features[labels == k].mean(axis=0) for k in found])
    for i in np.flatnonzero(labels == -1):
        labels[i] = found[int(np.argmin(np.linalg.norm(centres - features[i], axis=1)))]

    remap = {k: i for i, k in enumerate(found)}
    return np.array([remap[k] for k in labels.tolist()], dtype=int)


def representatives(embeddings: np.ndarray, members: np.ndarray, count: int = REPRESENTATIVES) -> list[int]:
    """The photos closest to the cluster centre, as indices into embeddings."""
    centre = embeddings[members].mean(axis=0)
    order = np.argsort(np.linalg.norm(embeddings[members] - centre, axis=1))
    return [int(members[i]) for i in order[:count]]

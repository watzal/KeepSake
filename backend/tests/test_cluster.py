from datetime import datetime, timedelta

import numpy as np

from app.services.cluster import cluster_photos, representatives


def blob(rng, centre, n):
    v = centre + 0.08 * rng.normal(size=(n, centre.size))
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def test_three_moments_become_three_clusters():
    rng = np.random.default_rng(0)
    centres = [np.eye(64)[i] for i in (0, 1, 2)]
    emb = np.vstack([blob(rng, c, 25) for c in centres])
    start = datetime(2026, 7, 14, 9)
    times = [start + timedelta(hours=6 * (i // 25), minutes=i % 25) for i in range(75)]

    labels = cluster_photos(emb, times)

    assert len(set(labels.tolist())) == 3
    for k in range(3):  # each true group lands in a single cluster
        assert len(set(labels[k * 25 : (k + 1) * 25].tolist())) == 1


def test_tiny_set_is_one_cluster():
    emb = np.eye(8)[:4]
    assert set(cluster_photos(emb, [None] * 4).tolist()) == {0}


def test_representatives_are_members():
    rng = np.random.default_rng(1)
    emb = blob(rng, np.eye(16)[0], 20)
    reps = representatives(emb, np.arange(20))
    assert len(reps) == 4 and set(reps) <= set(range(20))

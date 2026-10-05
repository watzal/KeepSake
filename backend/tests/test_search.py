import numpy as np

from app.services.search import top_k


def test_top_k_ranks_by_cosine():
    matrix = np.eye(4, dtype=np.float32)
    query = np.array([0.1, 0.9, 0, 0], dtype=np.float32)
    ranked = top_k(matrix, query, 2)
    assert [i for i, _ in ranked] == [1, 0]
    assert ranked[0][1] > ranked[1][1]


def test_top_k_empty():
    assert top_k(np.empty((0, 4), dtype=np.float32), np.zeros(4, dtype=np.float32), 5) == []

import numpy as np


def top_k(matrix: np.ndarray, query: np.ndarray, k: int) -> list[tuple[int, float]]:
    """Cosine-ranked (row index, score) pairs. Rows and query must be unit length."""
    if len(matrix) == 0:
        return []
    scores = matrix @ query
    order = np.argsort(-scores)[:k]
    return [(int(i), float(scores[i])) for i in order]

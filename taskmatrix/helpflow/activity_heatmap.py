from typing import List, Tuple, Dict

def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[float]:
    """
    Bucket activity counts into 'buckets' time intervals,
    returning either raw counts or normalized [0.0–1.0].
    - timestamps: list of epoch ms timestamps
    - counts: list of integer counts per timestamp
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        m = max(agg) or 1
        return [round(val / m, 4) for val in agg]
    return agg


def heatmap_with_labels(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> Dict[str, float]:
    """
    Returns a dict with bucket ranges as keys and counts (or normalized values) as values.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return {}

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    values = generate_activity_heatmap(timestamps, counts, buckets, normalize)
    labeled: Dict[str, float] = {}
    for i, v in enumerate(values):
        start = t_min + i * bucket_size
        end = start + bucket_size
        labeled[f"{int(start)}-{int(end)}"] = v
    return labeled


def get_peak_bucket(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10
) -> Tuple[int, float]:
    """
    Returns the index and value of the peak bucket (non-normalized).
    """
    values = generate_activity_heatmap(timestamps, counts, buckets, normalize=False)
    if not values:
        return -1, 0.0
    max_val = max(values)
    idx = values.index(max_val)
    return idx, max_val

class VikorHelper:
    DEFAULT_WEIGHTS = [1/3, 1/3, 1/3]
    DEFAULT_CRITERIA_TYPES = ['cost', 'cost', 'benefit']

    def __init__(self, data, weights=None, criteria_types=None):
        self.data = data
        self.weights = weights if weights is not None else self.DEFAULT_WEIGHTS
        self.criteria_types = criteria_types if criteria_types is not None else self.DEFAULT_CRITERIA_TYPES
        self.criteria = [k for k in data[0] if k.startswith('C')]

    def calculate(self):
        names = [d['name'] for d in self.data]
        ids = [d['product_id'] for d in self.data]
        matrix = [[d[c] for c in self.criteria] for d in self.data]

        f_star, f_minus = [], []
        for j, ctype in enumerate(self.criteria_types):
            col = [row[j] for row in matrix]
            f_star.append(max(col) if ctype == 'benefit' else min(col))
            f_minus.append(min(col) if ctype == 'benefit' else max(col))

        S, R = [], []
        for row in matrix:
            s_i, r_i = 0, 0
            for j, val in enumerate(row):
                if f_star[j] == f_minus[j]:
                    norm = 0
                else:
                    norm = (f_star[j] - val) / (f_star[j] - f_minus[j]) if self.criteria_types[j] == 'benefit' else (val - f_star[j]) / (f_minus[j] - f_star[j])
                w_norm = self.weights[j] * norm
                s_i += w_norm
                r_i = max(r_i, w_norm)
            S.append(s_i)
            R.append(r_i)

        S_star, S_minus = min(S), max(S)
        R_star, R_minus = min(R), max(R)

        Q = []
        v = 0.5
        for i in range(len(S)):
            q = 0
            if S_minus != S_star:
                q += v * (S[i] - S_star) / (S_minus - S_star)
            if R_minus != R_star:
                q += (1 - v) * (R[i] - R_star) / (R_minus - R_star)
            Q.append(q)

        results = []
        for i in range(len(self.data)):
            results.append({
                "name": names[i],
                "product_id": ids[i],
                "S": round(S[i], 6),
                "R": round(R[i], 6),
                "Q": round(Q[i], 6),
            })

        results.sort(key=lambda x: x['Q'])
        return results

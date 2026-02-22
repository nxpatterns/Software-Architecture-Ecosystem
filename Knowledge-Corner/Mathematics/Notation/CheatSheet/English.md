# Mathematical Notation — Language Reference

> **Goal:** Verbalize any formula fluently without having to look it up.
> **Structure:** Symbol | LaTeX | English Name | Spoken (EN)
> **Legend:** "Spoken" = how you say it in a lecture, seminar, or conversation.

---

## Table of Contents

1. [Basic Symbols & Arithmetic](#1-basic-symbols--arithmetic)
2. [Set Theory](#2-set-theory)
3. [Logic & Proofs](#3-logic--proofs)
4. [Analysis & Calculus](#4-analysis--calculus)
5. [Linear Algebra](#5-linear-algebra)
6. [Abstract Algebra](#6-abstract-algebra)
7. [Probability & Statistics](#7-probability--statistics)
8. [Number Theory](#8-number-theory)
9. [Topology](#9-topology)
10. [Differential Geometry](#10-differential-geometry)
11. [Category Theory](#11-category-theory)
12. [Greek Alphabet](#12-greek-alphabet)
13. [Calligraphic & Special Letters](#13-calligraphic--special-letters)

---

## 1. Basic Symbols & Arithmetic

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $+$ | `+` | Plus / Addition | "plus" |
| $-$ | `-` | Minus / Subtraction | "minus" |
| $\cdot$ | `\cdot` | Times / Dot | "times" / "multiplied by" |
| $\times$ | `\times` | Times / Cross product | "times" / "cross" |
| $\div$ | `\div` | Divided by | "divided by" |
| $/$ | `/` | Slash / Divided by | "over" / "divided by" |
| $=$ | `=` | Equals | "equals" / "is equal to" |
| $\neq$ | `\neq` | Not equal | "is not equal to" |
| $\approx$ | `\approx` | Approximately equal | "is approximately equal to" / "is about" |
| $\equiv$ | `\equiv` | Identical / Congruent | "is identically equal to" / "is congruent to" |
| $\sim$ | `\sim` | Similar / Equivalent | "is similar to" / "is equivalent to" |
| $\cong$ | `\cong` | Isomorphic / Congruent | "is isomorphic to" / "is congruent to" |
| $\propto$ | `\propto` | Proportional to | "is proportional to" |
| $<$ | `<` | Less than | "is less than" |
| $>$ | `>` | Greater than | "is greater than" |
| $\leq$ | `\leq` | Less than or equal | "is less than or equal to" |
| $\geq$ | `\geq` | Greater than or equal | "is greater than or equal to" |
| $\ll$ | `\ll` | Much less than | "is much less than" |
| $\gg$ | `\gg` | Much greater than | "is much greater than" |
| $a^n$ | `a^n` | $a$ to the power of $n$ | "$a$ to the $n$" / "$a$ to the power of $n$" |
| $\sqrt{x}$ | `\sqrt{x}` | Square root of $x$ | "the square root of $x$" |
| $\sqrt[n]{x}$ | `\sqrt[n]{x}` | $n$-th root of $x$ | "the $n$-th root of $x$" |
| $|x|$ | `|x|` | Absolute value of $x$ | "the absolute value of $x$" / "mod $x$" |
| $\lfloor x \rfloor$ | `\lfloor x \rfloor` | Floor of $x$ | "the floor of $x$" |
| $\lceil x \rceil$ | `\lceil x \rceil` | Ceiling of $x$ | "the ceiling of $x$" |
| $n!$ | `n!` | $n$ factorial | "$n$ factorial" |
| $\binom{n}{k}$ | `\binom{n}{k}` | Binomial coefficient | "$n$ choose $k$" |
| $\frac{a}{b}$ | `\frac{a}{b}` | Fraction $a$ over $b$ | "$a$ over $b$" / "$a$ divided by $b$" |
| $\pm$ | `\pm` | Plus or minus | "plus or minus" |
| $\mp$ | `\mp` | Minus or plus | "minus or plus" |
| $\infty$ | `\infty` | Infinity | "infinity" |
| $\%$ | `\%` | Percent | "percent" |
| $f \circ g$ | `f \circ g` | Composition | "$f$ composed with $g$" / "$f$ of $g$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $\frac{a+b}{c-d}$ | "$a$ plus $b$, over $c$ minus $d$" |
| $\sqrt[3]{x^2 + 1}$ | "the cube root of $x$ squared plus one" |
| $\binom{n}{2} = \frac{n(n-1)}{2}$ | "$n$ choose $2$ equals $n$ times $n$ minus $1$, over $2$" |
| $|x - a| < \varepsilon$ | "the absolute value of $x$ minus $a$ is less than epsilon" |

---

## 2. Set Theory

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $\in$ | `\in` | Element of | "is in" / "is an element of" |
| $\notin$ | `\notin` | Not an element of | "is not in" / "is not an element of" |
| $\ni$ | `\ni` | Contains as element | "contains" |
| $\subset$ | `\subset` | Proper subset | "is a proper subset of" |
| $\subseteq$ | `\subseteq` | Subset or equal | "is a subset of" |
| $\supset$ | `\supset` | Proper superset | "is a proper superset of" |
| $\supseteq$ | `\supseteq` | Superset or equal | "is a superset of" |
| $\not\subset$ | `\not\subset` | Not a subset | "is not a subset of" |
| $\cup$ | `\cup` | Union | "union" / "union with" |
| $\cap$ | `\cap` | Intersection | "intersect" / "intersection with" |
| $\setminus$ | `\setminus` | Set difference | "minus" / "set minus" / "without" |
| $A^c$ | `A^c` | Complement | "the complement of $A$" |
| $\overline{A}$ | `\overline{A}` | Complement / Closure | "$A$ bar" / "the complement of $A$" |
| $\emptyset$ | `\emptyset` | Empty set | "the empty set" |
| $\mathcal{P}(A)$ | `\mathcal{P}(A)` | Power set | "the power set of $A$" |
| $2^A$ | `2^A` | Power set | "two to the $A$" / "the power set of $A$" |
| $A \times B$ | `A \times B` | Cartesian product | "$A$ cross $B$" / "the Cartesian product of $A$ and $B$" |
| $A^n$ | `A^n` | $n$-fold Cartesian product | "$A$ to the $n$" |
| $|A|$ | `|A|` | Cardinality | "the cardinality of $A$" / "the size of $A$" |
| $\#A$ | `\#A` | Cardinality | "the number of elements of $A$" |
| $\aleph_0$ | `\aleph_0` | Aleph-null | "aleph-null" |
| $\aleph_1$ | `\aleph_1` | Aleph-one | "aleph-one" |
| $\mathbb{N}$ | `\mathbb{N}` | Natural numbers | "the natural numbers" |
| $\mathbb{Z}$ | `\mathbb{Z}` | Integers | "the integers" |
| $\mathbb{Q}$ | `\mathbb{Q}` | Rational numbers | "the rationals" |
| $\mathbb{R}$ | `\mathbb{R}` | Real numbers | "the reals" |
| $\mathbb{C}$ | `\mathbb{C}` | Complex numbers | "the complex numbers" |
| $\mathbb{R}^n$ | `\mathbb{R}^n` | $n$-dimensional real space | "R to the $n$" |
| $\{a, b, c\}$ | `\{a,b,c\}` | Set enumeration | "the set containing $a$, $b$, $c$" |
| $\{x \mid P(x)\}$ | `\{x \mid P(x)\}` | Set-builder notation | "the set of all $x$ such that $P$ of $x$" |
| $\{x : P(x)\}$ | `\{x : P(x)\}` | Set-builder (alt.) | "the set of all $x$ such that $P$ of $x$" |
| $\bigsqcup$ | `\bigsqcup` | Disjoint union | "disjoint union" |
| $\triangle$ | `\triangle` | Symmetric difference | "symmetric difference" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $A \setminus B = \{x \in A \mid x \notin B\}$ | "$A$ set minus $B$ is the set of all $x$ in $A$ such that $x$ is not in $B$" |
| $\mathcal{P}(\{1,2\})$ | "the power set of the set one, two" |
| $A \subseteq B \Leftrightarrow \forall x \in A: x \in B$ | "$A$ is a subset of $B$ if and only if for all $x$ in $A$, $x$ is in $B$" |

---

## 3. Logic & Proofs

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $\forall$ | `\forall` | For all / Universal quantifier | "for all" / "for every" |
| $\exists$ | `\exists` | There exists | "there exists" / "there is" |
| $\exists!$ | `\exists!` | There exists exactly one | "there exists exactly one" / "there is a unique" |
| $\nexists$ | `\nexists` | There does not exist | "there does not exist" |
| $\land$ | `\land` | Logical AND | "and" |
| $\lor$ | `\lor` | Logical OR | "or" |
| $\lnot$ | `\lnot` | Logical NOT | "not" |
| $\Rightarrow$ | `\Rightarrow` | Implies | "implies" / "then" |
| $\Leftarrow$ | `\Leftarrow` | Is implied by | "is implied by" / "follows from" |
| $\Leftrightarrow$ | `\Leftrightarrow` | If and only if | "if and only if" / "iff" |
| $\rightarrow$ | `\rightarrow` | Maps to / Implies | "to" / "maps to" |
| $\mapsto$ | `\mapsto` | Maps to | "maps to" / "goes to" |
| $\leftrightarrow$ | `\leftrightarrow` | Biconditional | "if and only if" (weaker form) |
| $\top$ | `\top` | Tautology / True | "true" / "top" |
| $\bot$ | `\bot` | Contradiction / False | "false" / "bottom" |
| $\vdash$ | `\vdash` | Proves / Derives | "proves" / "derives" / "it is provable that" |
| $\models$ | `\models` | Satisfies / Models | "satisfies" / "models" / "it is semantically true that" |
| $\therefore$ | `\therefore` | Therefore | "therefore" |
| $\because$ | `\because` | Because | "because" |
| $\square$ | `\square` | End of proof / QED | "QED" / "quod erat demonstrandum" / "end of proof" |
| $\blacksquare$ | `\blacksquare` | End of proof (filled) | "end of proof" |
| $\oplus$ | `\oplus` | XOR / Direct sum | "XOR" / "exclusive or" / "direct sum" |
| $\neg$ | `\neg` | Negation | "not" |
| $\iff$ | `\iff` | If and only if | "if and only if" / "iff" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $P \Leftrightarrow Q$ | "$P$ if and only if $Q$" |
| $\exists! x \in \mathbb{R}: x^2 = 0$ | "there exists exactly one $x$ in the reals such that $x$ squared equals zero" |

**Example with quantifiers:**

$$\forall \varepsilon > 0\ \exists \delta > 0: |x - a| < \delta \Rightarrow |f(x) - f(a)| < \varepsilon$$

*Spoken: "for all epsilon greater than zero there exists delta greater than zero such that: if the absolute value of $x$ minus $a$ is less than delta, then the absolute value of $f$ of $x$ minus $f$ of $a$ is less than epsilon"*

---

## 4. Analysis & Calculus

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $\lim_{x \to a} f(x)$ | `\lim_{x \to a} f(x)` | Limit | "the limit of $f$ of $x$ as $x$ approaches $a$" |
| $\lim_{x \to a^+}$ | `\lim_{x \to a^+}` | Right-hand limit | "the limit as $x$ approaches $a$ from the right" |
| $\lim_{x \to a^-}$ | `\lim_{x \to a^-}` | Left-hand limit | "the limit as $x$ approaches $a$ from the left" |
| $\lim_{x \to \infty}$ | `\lim_{x \to \infty}` | Limit at infinity | "the limit as $x$ goes to infinity" |
| $f'(x)$ | `f'(x)` | First derivative | "$f$ prime of $x$" |
| $f''(x)$ | `f''(x)` | Second derivative | "$f$ double prime of $x$" |
| $f^{(n)}(x)$ | `f^{(n)}(x)` | $n$-th derivative | "the $n$-th derivative of $f$ at $x$" |
| $\frac{df}{dx}$ | `\frac{df}{dx}` | Derivative (Leibniz) | "$d f$ $d x$" / "the derivative of $f$ with respect to $x$" |
| $\frac{d^n f}{dx^n}$ | `\frac{d^n f}{dx^n}` | $n$-th derivative | "$d$ to the $n$ $f$, $d x$ to the $n$" |
| $\dot{x}$ | `\dot{x}` | Time derivative (Newton) | "$x$ dot" |
| $\ddot{x}$ | `\ddot{x}` | Second time derivative | "$x$ double dot" |
| $\partial$ | `\partial` | Partial differential | "partial" |
| $\frac{\partial f}{\partial x}$ | `\frac{\partial f}{\partial x}` | Partial derivative | "the partial derivative of $f$ with respect to $x$" / "partial $f$ partial $x$" |
| $\frac{\partial^2 f}{\partial x^2}$ | `\frac{\partial^2 f}{\partial x^2}` | Second partial derivative | "the second partial derivative of $f$ with respect to $x$" |
| $\frac{\partial^2 f}{\partial x \partial y}$ | `\frac{\partial^2 f}{\partial x \partial y}` | Mixed partial derivative | "the mixed partial of $f$, first with respect to $y$, then $x$" |
| $\int f(x)\, dx$ | `\int f(x)\,dx` | Indefinite integral | "the integral of $f$ of $x$ with respect to $x$" |
| $\int_a^b f(x)\, dx$ | `\int_a^b f(x)\,dx` | Definite integral | "the integral from $a$ to $b$ of $f$ of $x$ with respect to $x$" |
| $\iint$ | `\iint` | Double integral | "the double integral" |
| $\iiint$ | `\iiint` | Triple integral | "the triple integral" |
| $\oint$ | `\oint` | Contour / Line integral | "the contour integral" / "the line integral around" |
| $\oiint$ | `\oiint` | Closed surface integral | "the closed surface integral" |
| $\sum_{i=1}^{n}$ | `\sum_{i=1}^{n}` | Summation | "the sum from $i$ equals one to $n$" |
| $\prod_{i=1}^{n}$ | `\prod_{i=1}^{n}` | Product | "the product from $i$ equals one to $n$" |
| $\nabla$ | `\nabla` | Nabla / Del operator | "nabla" / "del" |
| $\nabla f$ | `\nabla f` | Gradient of $f$ | "nabla $f$" / "the gradient of $f$" |
| $\nabla \cdot \mathbf{F}$ | `\nabla \cdot \mathbf{F}` | Divergence | "del dot $F$" / "the divergence of $F$" |
| $\nabla \times \mathbf{F}$ | `\nabla \times \mathbf{F}` | Curl | "del cross $F$" / "the curl of $F$" |
| $\nabla^2$ | `\nabla^2` | Laplacian | "del squared" / "the Laplacian" |
| $\Delta$ | `\Delta` | Laplacian / Delta | "delta" / "the Laplacian of" |
| $\Delta f$ | `\Delta f` | Laplacian of $f$ | "delta $f$" / "the Laplacian of $f$" |
| $e^x$ | `e^x` | Exponential function | "$e$ to the $x$" |
| $\exp(x)$ | `\exp(x)` | Exponential function | "exp of $x$" |
| $\ln x$ | `\ln x` | Natural logarithm | "the natural log of $x$" / "ln $x$" |
| $\log x$ | `\log x` | Logarithm | "log $x$" |
| $\log_a x$ | `\log_a x` | Logarithm base $a$ | "log base $a$ of $x$" |
| $\sin, \cos, \tan$ | `\sin, \cos, \tan` | Sine, Cosine, Tangent | "sine $x$", "cosine $x$", "tangent $x$" |
| $\arcsin, \arccos, \arctan$ | `\arcsin` etc. | Arc sine etc. | "arc sine of $x$" / "inverse sine of $x$" |
| $\sinh, \cosh, \tanh$ | `\sinh` etc. | Hyperbolic sine etc. | "hyperbolic sine of $x$" |
| $O(f)$ | `O(f)` | Big-O notation | "big O of $f$" |
| $o(f)$ | `o(f)` | Little-o notation | "little o of $f$" |
| $\Theta(f)$ | `\Theta(f)` | Theta notation | "theta of $f$" |
| $\sim$ | `\sim` | Asymptotically equivalent | "is asymptotically equivalent to" / "behaves like" |
| $[a, b]$ | `[a,b]` | Closed interval | "the closed interval from $a$ to $b$" |
| $(a, b)$ | `(a,b)` | Open interval | "the open interval from $a$ to $b$" |
| $[a, b)$ | `[a,b)` | Half-open interval | "the half-open interval from $a$ to $b$, including $a$" |
| $\sup$ | `\sup` | Supremum | "the supremum of" / "the sup of" |
| $\inf$ | `\inf` | Infimum | "the infimum of" / "the inf of" |
| $\max$ | `\max` | Maximum | "the maximum of" |
| $\min$ | `\min` | Minimum | "the minimum of" |
| $\limsup$ | `\limsup` | Limit superior | "the lim sup of" / "the limit superior of" |
| $\liminf$ | `\liminf` | Limit inferior | "the lim inf of" / "the limit inferior of" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}$ | "the integral from zero to infinity of $e$ to the minus $x$ squared with respect to $x$ equals root pi over two" |
| $\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$ | "the second partial derivative of $u$ with respect to $t$ equals $c$ squared times the Laplacian of $u$" |
| $\sum_{n=0}^{\infty} \frac{x^n}{n!} = e^x$ | "the sum from $n$ equals zero to infinity of $x$ to the $n$ over $n$ factorial equals $e$ to the $x$" |
| $\oint_C \mathbf{F} \cdot d\mathbf{r}$ | "the line integral around $C$ of $F$ dot $dr$" |

---

## 5. Linear Algebra

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $\mathbf{v}$ | `\mathbf{v}` | Vector $v$ | "vector $v$" |
| $\vec{v}$ | `\vec{v}` | Vector $v$ | "vector $v$" |
| $\mathbf{0}$ | `\mathbf{0}` | Zero vector | "the zero vector" |
| $\|\mathbf{v}\|$ | `\|\mathbf{v}\|` | Norm / Length | "the norm of $v$" / "the length of $v$" |
| $\|\mathbf{v}\|_2$ | `\|\mathbf{v}\|_2` | Euclidean norm | "the Euclidean norm of $v$" / "the $L$-two norm of $v$" |
| $\|\mathbf{v}\|_1$ | `\|\mathbf{v}\|_1` | L1 norm | "the $L$-one norm of $v$" |
| $\|\mathbf{v}\|_\infty$ | `\|\mathbf{v}\|_\infty` | Infinity norm | "the infinity norm of $v$" / "the max norm of $v$" |
| $\langle \mathbf{u}, \mathbf{v} \rangle$ | `\langle \mathbf{u}, \mathbf{v} \rangle` | Inner product | "the inner product of $u$ and $v$" |
| $\mathbf{u} \cdot \mathbf{v}$ | `\mathbf{u} \cdot \mathbf{v}` | Dot product | "$u$ dot $v$" |
| $\mathbf{u} \times \mathbf{v}$ | `\mathbf{u} \times \mathbf{v}` | Cross product | "$u$ cross $v$" |
| $\mathbf{u} \perp \mathbf{v}$ | `\mathbf{u} \perp \mathbf{v}` | Perpendicular | "$u$ is perpendicular to $v$" / "$u$ is orthogonal to $v$" |
| $A^T$ | `A^T` | Transpose | "$A$ transpose" |
| $A^H$ | `A^H` | Hermitian conjugate | "$A$ Hermitian" / "$A$ adjoint" / "$A$ dagger" |
| $A^{-1}$ | `A^{-1}` | Inverse matrix | "$A$ inverse" / "the inverse of $A$" |
| $\det(A)$ | `\det(A)` | Determinant | "the determinant of $A$" |
| $|A|$ | `|A|` | Determinant | "the determinant of $A$" |
| $\text{tr}(A)$ | `\text{tr}(A)` | Trace | "the trace of $A$" |
| $\text{rank}(A)$ | `\text{rank}(A)` | Rank | "the rank of $A$" |
| $\ker(A)$ | `\ker(A)` | Kernel / Null space | "the kernel of $A$" / "the null space of $A$" |
| $\text{im}(A)$ | `\text{im}(A)` | Image | "the image of $A$" |
| $\text{col}(A)$ | `\text{col}(A)` | Column space | "the column space of $A$" |
| $\text{null}(A)$ | `\text{null}(A)` | Null space | "the null space of $A$" |
| $\lambda$ | `\lambda` | Eigenvalue | "lambda" / "the eigenvalue lambda" |
| $A\mathbf{v} = \lambda \mathbf{v}$ | `A\mathbf{v}=\lambda\mathbf{v}` | Eigenvalue equation | "$A$ times $v$ equals lambda times $v$" |
| $\sigma(A)$ | `\sigma(A)` | Spectrum | "the spectrum of $A$" |
| $\rho(A)$ | `\rho(A)` | Spectral radius | "the spectral radius of $A$" |
| $\|A\|$ | `\|A\|` | Matrix norm | "the norm of $A$" |
| $\otimes$ | `\otimes` | Tensor product / Kronecker product | "tensor product" / "Kronecker product" |
| $\oplus$ | `\oplus` | Direct sum | "direct sum" |
| $V \oplus W$ | `V \oplus W` | Direct sum of $V$ and $W$ | "$V$ direct sum $W$" |
| $V^\perp$ | `V^\perp` | Orthogonal complement | "$V$ perp" / "the orthogonal complement of $V$" |
| $\text{span}(\ldots)$ | `\text{span}` | Span | "the span of" |
| $\dim(V)$ | `\dim(V)` | Dimension | "the dimension of $V$" |
| $\mathbf{e}_i$ | `\mathbf{e}_i` | $i$-th unit vector | "the $i$-th standard basis vector" |
| $I_n$ | `I_n` | Identity matrix | "the $n$ by $n$ identity matrix" |
| $O$ | `O` | Zero matrix | "the zero matrix" |
| $\text{diag}(a_1, \ldots, a_n)$ | `\text{diag}` | Diagonal matrix | "the diagonal matrix with entries $a_1$ through $a_n$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $A\mathbf{x} = \mathbf{b}$ | "$A$ times $x$ equals $b$" |
| $\det(A - \lambda I) = 0$ | "the determinant of $A$ minus lambda times the identity equals zero" |
| $\langle \mathbf{u}, \mathbf{v} \rangle = \|\mathbf{u}\|\, \|\mathbf{v}\| \cos\theta$ | "the inner product of $u$ and $v$ equals the norm of $u$ times the norm of $v$ times cosine theta" |
| $V = \ker(A) \oplus \text{im}(A^T)$ | "$V$ is the direct sum of the kernel of $A$ and the image of $A$ transpose" |

---

## 6. Abstract Algebra

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $(G, \cdot)$ | `(G, \cdot)` | Group | "the group $G$ with operation dot" |
| $e$ or $1$ | `e` | Identity element | "the identity element" |
| $a^{-1}$ | `a^{-1}` | Inverse element | "the inverse of $a$" / "$a$ inverse" |
| $|G|$ | `|G|` | Order of group | "the order of $G$" |
| $\text{ord}(a)$ | `\text{ord}(a)` | Order of element | "the order of $a$" |
| $H \leq G$ | `H \leq G` | Subgroup | "$H$ is a subgroup of $G$" |
| $H \trianglelefteq G$ | `H \trianglelefteq G` | Normal subgroup | "$H$ is a normal subgroup of $G$" |
| $G/H$ | `G/H` | Quotient group | "$G$ mod $H$" / "$G$ modulo $H$" / "the quotient group $G$ over $H$" |
| $aH$ | `aH` | Left coset | "the left coset of $a$ mod $H$" |
| $Ha$ | `Ha` | Right coset | "the right coset of $a$ mod $H$" |
| $[G:H]$ | `[G:H]` | Index | "the index of $H$ in $G$" |
| $G \cong H$ | `G \cong H` | Isomorphic | "$G$ is isomorphic to $H$" |
| $\phi: G \to H$ | `\phi: G \to H` | Homomorphism | "phi from $G$ to $H$" |
| $\ker(\phi)$ | `\ker(\phi)` | Kernel | "the kernel of phi" |
| $\text{im}(\phi)$ | `\text{im}(\phi)` | Image | "the image of phi" |
| $\mathbb{Z}/n\mathbb{Z}$ | `\mathbb{Z}/n\mathbb{Z}` | Integers mod $n$ | "the integers mod $n$" |
| $\mathbb{Z}_n$ | `\mathbb{Z}_n$ | Cyclic group | "$\mathbb{Z}$ sub $n$" / "cyclic group of order $n$" |
| $S_n$ | `S_n` | Symmetric group | "the symmetric group $S$ sub $n$" |
| $A_n$ | `A_n` | Alternating group | "the alternating group $A$ sub $n$" |
| $D_n$ | `D_n` | Dihedral group | "the dihedral group $D$ sub $n$" |
| $(R, +, \cdot)$ | `(R,+,\cdot)` | Ring | "the ring $R$ with addition and multiplication" |
| $R^\times$ | `R^\times` | Unit group | "the unit group of $R$" |
| $\text{char}(R)$ | `\text{char}(R)` | Characteristic | "the characteristic of $R$" |
| $(K, +, \cdot)$ | `(K,+,\cdot)` | Field | "the field $K$" |
| $[L:K]$ | `[L:K]` | Degree of field extension | "the degree of $L$ over $K$" |
| $\text{Gal}(L/K)$ | `\text{Gal}(L/K)` | Galois group | "the Galois group of $L$ over $K$" |
| $a \equiv b \pmod{n}$ | `a \equiv b \pmod{n}` | Congruent modulo $n$ | "$a$ is congruent to $b$ mod $n$" |
| $a \mid b$ | `a \mid b` | $a$ divides $b$ | "$a$ divides $b$" |
| $a \nmid b$ | `a \nmid b` | $a$ does not divide $b$ | "$a$ does not divide $b$" |
| $\gcd(a,b)$ | `\gcd(a,b)` | Greatest common divisor | "the GCD of $a$ and $b$" / "the greatest common divisor of $a$ and $b$" |
| $\text{lcm}(a,b)$ | `\text{lcm}(a,b)` | Least common multiple | "the LCM of $a$ and $b$" |
| $\langle a \rangle$ | `\langle a \rangle` | Generated by $a$ | "the group generated by $a$" |
| $\langle a_1, \ldots, a_n \rangle$ | `\langle a_1,\ldots,a_n\rangle` | Generated by | "the group generated by $a_1$ through $a_n$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $H \trianglelefteq G \Rightarrow G/H$ is a group | "$H$ is a normal subgroup of $G$, hence $G$ mod $H$ is a group" |
| $\|GL_n(\mathbb{F}_q)\| = \prod_{k=0}^{n-1}(q^n - q^k)$ | "the order of $GL$ sub $n$ over $\mathbb{F}$ sub $q$ is the product from $k$ equals zero to $n$ minus one of $q$ to the $n$ minus $q$ to the $k$" |
| $a \equiv b \pmod{n}$ | "$a$ is congruent to $b$ mod $n$" (meaning "$n$ divides $a$ minus $b$") |

---

## 7. Probability & Statistics

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $P(A)$ | `P(A)` | Probability of $A$ | "the probability of $A$" |
| $P(A \mid B)$ | `P(A \mid B)` | Conditional probability | "the probability of $A$ given $B$" |
| $P(A \cap B)$ | `P(A \cap B)` | Joint probability | "the probability of $A$ and $B$" |
| $P(A \cup B)$ | `P(A \cup B)` | Probability of union | "the probability of $A$ or $B$" |
| $\Omega$ | `\Omega` | Sample space | "omega" / "the sample space" |
| $\sigma$ | `\sigma` | Sigma-algebra / Std. deviation | "sigma" |
| $\mathcal{F}$ | `\mathcal{F}` | Sigma-algebra | "the sigma-algebra $\mathcal{F}$" |
| $\mathbb{E}[X]$ | `\mathbb{E}[X]` | Expected value | "the expected value of $X$" / "E of $X$" |
| $\mathbb{E}[X \mid Y]$ | `\mathbb{E}[X \mid Y]` | Conditional expectation | "the expected value of $X$ given $Y$" |
| $\text{Var}(X)$ | `\text{Var}(X)` | Variance | "the variance of $X$" |
| $\sigma^2$ | `\sigma^2` | Variance | "sigma squared" / "the variance" |
| $\sigma_X$ | `\sigma_X` | Standard deviation | "the standard deviation of $X$" |
| $\text{Cov}(X,Y)$ | `\text{Cov}(X,Y)` | Covariance | "the covariance of $X$ and $Y$" |
| $\text{Corr}(X,Y)$ | `\text{Corr}(X,Y)` | Correlation | "the correlation of $X$ and $Y$" |
| $\rho_{XY}$ | `\rho_{XY}` | Correlation coefficient | "rho of $X$ and $Y$" / "the correlation coefficient" |
| $X \sim \mathcal{N}(\mu, \sigma^2)$ | `X \sim \mathcal{N}(\mu,\sigma^2)` | Normally distributed | "$X$ follows a normal distribution with mean mu and variance sigma squared" / "$X$ is $N$ mu, sigma squared" |
| $X \sim \text{Ber}(p)$ | `X \sim \text{Ber}(p)` | Bernoulli distributed | "$X$ is Bernoulli with parameter $p$" |
| $X \sim \text{Bin}(n,p)$ | `X \sim \text{Bin}(n,p)` | Binomially distributed | "$X$ is binomial with parameters $n$ and $p$" |
| $X \sim \text{Poi}(\lambda)$ | `X \sim \text{Poi}(\lambda)` | Poisson distributed | "$X$ is Poisson with parameter lambda" |
| $X \sim \text{Exp}(\lambda)$ | `X \sim \text{Exp}(\lambda)` | Exponentially distributed | "$X$ is exponential with rate lambda" |
| $f_X(x)$ | `f_X(x)` | Probability density function | "the PDF of $X$ at $x$" / "the density of $X$ at $x$" |
| $F_X(x)$ | `F_X(x)` | Cumulative distribution function | "the CDF of $X$" |
| $\bar{X}$ | `\bar{X}` | Sample mean | "$X$ bar" / "the sample mean" |
| $\hat{\theta}$ | `\hat{\theta}` | Estimator of $\theta$ | "theta hat" / "the estimator of theta" |
| $\Phi$ | `\Phi` | Standard normal CDF | "phi" / "the standard normal CDF" |
| $X \perp Y$ | `X \perp Y` | Independent | "$X$ is independent of $Y$" |
| $\mathcal{L}(\theta)$ | `\mathcal{L}(\theta)` | Likelihood function | "the likelihood of theta" |
| $\ell(\theta)$ | `\ell(\theta)` | Log-likelihood | "the log-likelihood of theta" |
| $\overset{d}{=}$ | `\overset{d}{=}` | Equal in distribution | "equal in distribution" |
| $\xrightarrow{d}$ | `\xrightarrow{d}` | Convergence in distribution | "converges in distribution to" |
| $\xrightarrow{p}$ | `\xrightarrow{p}` | Convergence in probability | "converges in probability to" |
| $\xrightarrow{a.s.}$ | `\xrightarrow{a.s.}` | Almost sure convergence | "converges almost surely to" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $P(A \mid B) = \frac{P(A \cap B)}{P(B)}$ | "the probability of $A$ given $B$ equals the probability of $A$ and $B$ over the probability of $B$" |
| $X \sim \mathcal{N}(0,1)$ | "$X$ follows a standard normal distribution" / "$X$ is standard normal" |
| $\mathbb{E}[X^2] = \text{Var}(X) + (\mathbb{E}[X])^2$ | "the expected value of $X$ squared equals the variance of $X$ plus the square of the expected value of $X$" |

---

## 8. Number Theory

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $p$ prime | — | $p$ is prime | "$p$ is prime" |
| $a \mid b$ | `a \mid b` | $a$ divides $b$ | "$a$ divides $b$" |
| $a \nmid b$ | `a \nmid b` | $a$ does not divide $b$ | "$a$ does not divide $b$" |
| $a \equiv b \pmod{m}$ | `a \equiv b \pmod{m}` | Congruence | "$a$ is congruent to $b$ mod $m$" |
| $\gcd(a,b)$ | `\gcd(a,b)` | GCD | "the GCD of $a$ and $b$" |
| $\text{lcm}(a,b)$ | `\text{lcm}(a,b)` | LCM | "the LCM of $a$ and $b$" |
| $\varphi(n)$ | `\varphi(n)` | Euler's totient | "Euler's phi of $n$" / "Euler's totient of $n$" |
| $\mu(n)$ | `\mu(n)` | Möbius function | "the Möbius function of $n$" / "mu of $n$" |
| $\tau(n)$ | `\tau(n)` | Number of divisors | "tau of $n$" / "the number of divisors of $n$" |
| $\sigma(n)$ | `\sigma(n)` | Sum of divisors | "sigma of $n$" / "the sum of divisors of $n$" |
| $\Lambda(n)$ | `\Lambda(n)` | Von Mangoldt function | "the von Mangoldt function of $n$" / "capital lambda of $n$" |
| $\pi(x)$ | `\pi(x)` | Prime-counting function | "pi of $x$" / "the prime-counting function" |
| $\zeta(s)$ | `\zeta(s)` | Riemann zeta function | "zeta of $s$" / "the Riemann zeta function of $s$" |
| $\left(\frac{a}{p}\right)$ | `\left(\frac{a}{p}\right)` | Legendre symbol | "the Legendre symbol $a$ over $p$" |
| $\left(\frac{a}{n}\right)$ | `\left(\frac{a}{n}\right)` | Jacobi symbol | "the Jacobi symbol $a$ over $n$" |
| $\mathbb{Z}[i]$ | `\mathbb{Z}[i]` | Gaussian integers | "the Gaussian integers" |
| $p^k \| n$ | `p^k \| n` | Exact power divides | "$p$ to the $k$ exactly divides $n$" |
| $v_p(n)$ | `v_p(n)` | $p$-adic valuation | "the $p$-adic valuation of $n$" |
| $\mathbb{Z}_p$ | `\mathbb{Z}_p` | $p$-adic integers | "the $p$-adic integers" |
| $\mathbb{Q}_p$ | `\mathbb{Q}_p` | $p$-adic numbers | "the $p$-adic numbers" |
| $\lfloor x \rfloor$ | `\lfloor x \rfloor` | Floor | "the floor of $x$" |
| $\{x\}$ | `\{x\}` | Fractional part | "the fractional part of $x$" |
| $\text{ord}_m(a)$ | `\text{ord}_m(a)` | Order mod $m$ | "the order of $a$ mod $m$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $a^{\varphi(n)} \equiv 1 \pmod{n}$ | "$a$ to the phi of $n$ is congruent to one mod $n$" (Euler's theorem) |
| $\gcd(a,b) \cdot \text{lcm}(a,b) = a \cdot b$ | "the GCD of $a$ and $b$ times the LCM of $a$ and $b$ equals $a$ times $b$" |

---

## 9. Topology

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $(X, \tau)$ | `(X, \tau)` | Topological space | "the topological space $X$ with topology tau" |
| $\tau$ | `\tau` | Topology | "tau" / "the topology" |
| $\overline{A}$ | `\overline{A}` | Closure of $A$ | "the closure of $A$" / "$A$ bar" |
| $A^\circ$ | `A^\circ` | Interior of $A$ | "the interior of $A$" |
| $\partial A$ | `\partial A` | Boundary of $A$ | "the boundary of $A$" |
| $A'$ | `A'` | Derived set | "the derived set of $A$" / "$A$ prime" |
| $U_\varepsilon(x)$ | `U_\varepsilon(x)` | $\varepsilon$-neighborhood | "the epsilon-neighborhood of $x$" |
| $B_r(x)$ | `B_r(x)` | Open ball | "the open ball of radius $r$ around $x$" |
| $\overline{B_r(x)}$ | `\overline{B_r(x)}` | Closed ball | "the closed ball of radius $r$ around $x$" |
| $d(x,y)$ | `d(x,y)` | Metric / Distance | "the distance from $x$ to $y$" |
| $(X, d)$ | `(X, d)` | Metric space | "the metric space $X$ with metric $d$" |
| $f: X \to Y$ continuous | — | Continuous map | "$f$ from $X$ to $Y$ is continuous" |
| $\pi_1(X, x_0)$ | `\pi_1(X,x_0)` | Fundamental group | "the fundamental group of $X$ at base point $x_0$" |
| $\pi_n(X)$ | `\pi_n(X)` | $n$-th homotopy group | "the $n$-th homotopy group of $X$" |
| $H_n(X)$ | `H_n(X)` | $n$-th homology group | "the $n$-th homology group of $X$" |
| $H^n(X)$ | `H^n(X)` | $n$-th cohomology group | "the $n$-th cohomology group of $X$" |
| $X \simeq Y$ | `X \simeq Y` | Homotopy equivalent | "$X$ is homotopy equivalent to $Y$" |
| $X \cong Y$ | `X \cong Y` | Homeomorphic | "$X$ is homeomorphic to $Y$" |
| $X / {\sim}$ | `X/{\sim}` | Quotient space | "$X$ modulo the equivalence relation" / "$X$ quotiented by tilde" |
| $X \vee Y$ | `X \vee Y` | Wedge sum | "$X$ wedge $Y$" / "the wedge sum of $X$ and $Y$" |
| $X \times Y$ | `X \times Y` | Product space | "the product space $X$ cross $Y$" |
| $\chi(X)$ | `\chi(X)` | Euler characteristic | "the Euler characteristic of $X$" |
| $\tilde{H}_n(X)$ | `\tilde{H}_n(X)` | Reduced homology | "the reduced $n$-th homology of $X$" |
| $\Sigma X$ | `\Sigma X` | Suspension | "the suspension of $X$" |
| $\Omega X$ | `\Omega X` | Loop space | "the loop space of $X$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $\overline{A} = A \cup \partial A$ | "the closure of $A$ equals $A$ union the boundary of $A$" |
| $\pi_1(S^1) \cong \mathbb{Z}$ | "the fundamental group of the one-sphere is isomorphic to the integers" |

---

## 10. Differential Geometry

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $M, N$ | `M, N` | Manifold | "manifold $M$" |
| $T_p M$ | `T_pM` | Tangent space | "the tangent space to $M$ at $p$" |
| $T^*_p M$ | `T^*_pM` | Cotangent space | "the cotangent space to $M$ at $p$" |
| $TM$ | `TM` | Tangent bundle | "the tangent bundle of $M$" |
| $T^*M$ | `T^*M` | Cotangent bundle | "the cotangent bundle of $M$" |
| $g_{ij}$ | `g_{ij}` | Metric tensor | "the metric tensor $g$ sub $i j$" |
| $g$ | `g` | Riemannian metric | "the Riemannian metric $g$" |
| $\Gamma^k_{ij}$ | `\Gamma^k_{ij}` | Christoffel symbol | "the Christoffel symbol gamma $k$ $i j$" |
| $\nabla$ | `\nabla` | Covariant derivative | "the covariant derivative" / "nabla" |
| $\nabla_X Y$ | `\nabla_X Y` | Covariant derivative of $Y$ in direction $X$ | "the covariant derivative of $Y$ in the direction of $X$" |
| $R^l{}_{ijk}$ | `R^l{}_{ijk}` | Riemann curvature tensor | "the Riemann curvature tensor" |
| $R_{ij}$ | `R_{ij}` | Ricci tensor | "the Ricci tensor $R$ sub $i j$" |
| $R$ | `R` | Ricci scalar / Scalar curvature | "the Ricci scalar" / "the scalar curvature" |
| $K$ | `K` | Gaussian curvature | "the Gaussian curvature" |
| $\kappa$ | `\kappa` | Curvature of a curve | "kappa" / "the curvature" |
| $\tau$ | `\tau` | Torsion | "tau" / "the torsion" |
| $\omega$ | `\omega` | Differential form | "omega" / "the differential form omega" |
| $d\omega$ | `d\omega` | Exterior derivative | "the exterior derivative of omega" / "$d$ omega" |
| $\omega \wedge \eta$ | `\omega \wedge \eta` | Wedge product | "omega wedge eta" / "the wedge product of omega and eta" |
| $\int_M \omega$ | `\int_M \omega` | Integral of a form | "the integral of omega over $M$" |
| $\mathcal{L}_X$ | `\mathcal{L}_X` | Lie derivative | "the Lie derivative in the direction of $X$" |
| $[X, Y]$ | `[X,Y]` | Lie bracket | "the Lie bracket of $X$ and $Y$" |
| $\iota_X \omega$ | `\iota_X \omega` | Interior product | "the interior product of omega with $X$" |
| $\Omega^k(M)$ | `\Omega^k(M)` | $k$-forms on $M$ | "$k$-forms on $M$" |

### Examples (Spoken)

| Formula | Spoken |
|---------|--------|
| $d(d\omega) = 0$ | "the exterior derivative of the exterior derivative of omega is zero" |
| $\int_M d\omega = \int_{\partial M} \omega$ | "the integral of $d$ omega over $M$ equals the integral of omega over the boundary of $M$" (Stokes' theorem) |

---

## 11. Category Theory

| Symbol | LaTeX | English Name | Spoken (EN) |
|--------|-------|--------------|-------------|
| $\mathcal{C}$ | `\mathcal{C}` | Category | "the category $\mathcal{C}$" |
| $\text{Ob}(\mathcal{C})$ | `\text{Ob}(\mathcal{C})` | Objects | "the objects of $\mathcal{C}$" |
| $\text{Mor}(\mathcal{C})$ | `\text{Mor}(\mathcal{C})` | Morphisms | "the morphisms of $\mathcal{C}$" |
| $\text{Hom}(A, B)$ | `\text{Hom}(A,B)` | Hom-set | "Hom of $A$ and $B$" / "the hom-set from $A$ to $B$" |
| $f: A \to B$ | `f: A \to B` | Morphism | "morphism $f$ from $A$ to $B$" |
| $g \circ f$ | `g \circ f` | Composition | "$g$ composed with $f$" / "$g$ after $f$" |
| $\text{id}_A$ | `\text{id}_A` | Identity morphism | "the identity on $A$" |
| $F: \mathcal{C} \to \mathcal{D}$ | `F: \mathcal{C} \to \mathcal{D}` | Functor | "functor $F$ from $\mathcal{C}$ to $\mathcal{D}$" |
| $\eta: F \Rightarrow G$ | `\eta: F \Rightarrow G` | Natural transformation | "natural transformation eta from $F$ to $G$" |
| $\mathcal{C}^{op}$ | `\mathcal{C}^{op}` | Opposite category | "the opposite category of $\mathcal{C}$" / "$\mathcal{C}$ op" |
| $\mathcal{C} \times \mathcal{D}$ | `\mathcal{C} \times \mathcal{D}` | Product category | "the product category of $\mathcal{C}$ and $\mathcal{D}$" |
| $\text{Fun}(\mathcal{C}, \mathcal{D})$ | `\text{Fun}(\mathcal{C},\mathcal{D})` | Functor category | "the functor category from $\mathcal{C}$ to $\mathcal{D}$" |
| $\lim$ | `\lim` | Limit (categorical) | "the limit" |
| $\text{colim}$ | `\text{colim}` | Colimit | "the colimit" |
| $A \times B$ | `A \times B` | Product | "the product of $A$ and $B$" |
| $A \sqcup B$ | `A \sqcup B` | Coproduct | "the coproduct of $A$ and $B$" |
| $A \cong B$ | `A \cong B` | Isomorphic | "$A$ is isomorphic to $B$" |
| $\dashv$ | `\dashv` | Left adjoint | "is left adjoint to" |
| $F \dashv G$ | `F \dashv G` | Adjunction | "$F$ is left adjoint to $G$" / "$F$ adjoint $G$" |
| $\mathbf{Set}$ | `\mathbf{Set}` | Category of sets | "the category of sets" |
| $\mathbf{Grp}$ | `\mathbf{Grp}` | Category of groups | "the category of groups" |
| $\mathbf{Top}$ | `\mathbf{Top}` | Category of topological spaces | "the category of topological spaces" |
| $\mathbf{Vect}_k$ | `\mathbf{Vect}_k` | Category of vector spaces | "the category of vector spaces over $k$" |
| $\text{Nat}(F,G)$ | `\text{Nat}(F,G)` | Natural transformations | "the natural transformations from $F$ to $G$" |

---

## 12. Greek Alphabet

| Lowercase | Uppercase | LaTeX (lower) | LaTeX (upper) | Name | Typical Use |
|-----------|-----------|--------------|--------------|------|-------------|
| $\alpha$ | $A$ | `\alpha` | `A` | Alpha | angles, parameters |
| $\beta$ | $B$ | `\beta` | `B` | Beta | angles, parameters |
| $\gamma$ | $\Gamma$ | `\gamma` | `\Gamma` | Gamma | curves, Gamma function, Euler–Mascheroni constant |
| $\delta$ | $\Delta$ | `\delta` | `\Delta` | Delta | differences, limit definitions |
| $\varepsilon$ | $E$ | `\varepsilon` | `E` | Epsilon | small positive quantities, limits |
| $\epsilon$ | $E$ | `\epsilon` | `E` | Epsilon (alt.) | same as $\varepsilon$ |
| $\zeta$ | $Z$ | `\zeta` | `Z` | Zeta | Riemann zeta function |
| $\eta$ | $H$ | `\eta` | `H` | Eta | natural transformations, efficiency |
| $\theta$ | $\Theta$ | `\theta` | `\Theta` | Theta | angles, parameters |
| $\vartheta$ | $\Theta$ | `\vartheta` | `\Theta` | Theta (var.) | angles (alternative form) |
| $\iota$ | $I$ | `\iota` | `I` | Iota | embeddings |
| $\kappa$ | $K$ | `\kappa` | `K` | Kappa | curvature |
| $\lambda$ | $\Lambda$ | `\lambda` | `\Lambda` | Lambda | eigenvalues, parameters |
| $\mu$ | $M$ | `\mu` | `M` | Mu | mean, measure |
| $\nu$ | $N$ | `\nu` | `N` | Nu | frequency |
| $\xi$ | $\Xi$ | `\xi` | `\Xi` | Xi | variables |
| $o$ | $O$ | `o` | `O` | Omicron | rarely used |
| $\pi$ | $\Pi$ | `\pi` | `\Pi` | Pi | circle constant, projection, product |
| $\varpi$ | $\Pi$ | `\varpi` | `\Pi` | Pi (var.) | cyclotomic contexts |
| $\rho$ | $P$ | `\rho` | `P` | Rho | density, correlation, spectral radius |
| $\varrho$ | $P$ | `\varrho` | `P` | Rho (var.) | same as $\rho$ |
| $\sigma$ | $\Sigma$ | `\sigma` | `\Sigma` | Sigma | standard deviation, sum, sigma-algebra |
| $\tau$ | $T$ | `\tau` | `T` | Tau | torsion, topology |
| $\upsilon$ | $\Upsilon$ | `\upsilon` | `\Upsilon` | Upsilon | rarely used |
| $\phi$ | $\Phi$ | `\phi` | `\Phi` | Phi | angles, morphisms, normal CDF |
| $\varphi$ | $\Phi$ | `\varphi` | `\Phi` | Phi (var.) | Euler's totient, angles |
| $\chi$ | $X$ | `\chi` | `X` | Chi | Euler characteristic, chi-squared |
| $\psi$ | $\Psi$ | `\psi` | `\Psi` | Psi | wave function, digamma |
| $\omega$ | $\Omega$ | `\omega` | `\Omega` | Omega | angular frequency, sample space, differential forms |

---

## 13. Calligraphic & Special Letters

| Symbol | LaTeX | Name | Typical Use |
|--------|-------|------|-------------|
| $\mathbb{N}$ | `\mathbb{N}` | Blackboard bold N | Natural numbers |
| $\mathbb{Z}$ | `\mathbb{Z}` | Blackboard bold Z | Integers |
| $\mathbb{Q}$ | `\mathbb{Q}` | Blackboard bold Q | Rationals |
| $\mathbb{R}$ | `\mathbb{R}` | Blackboard bold R | Reals |
| $\mathbb{C}$ | `\mathbb{C}` | Blackboard bold C | Complex numbers |
| $\mathbb{H}$ | `\mathbb{H}` | Blackboard bold H | Quaternions |
| $\mathbb{F}$ | `\mathbb{F}` | Blackboard bold F | Finite fields |
| $\mathbb{P}$ | `\mathbb{P}` | Blackboard bold P | Projective space / Probability |
| $\mathcal{A}$ | `\mathcal{A}` | Script A | Sigma-algebras, categories |
| $\mathcal{B}$ | `\mathcal{B}` | Script B | Borel sigma-algebra |
| $\mathcal{C}$ | `\mathcal{C}` | Script C | Categories |
| $\mathcal{F}$ | `\mathcal{F}` | Script F | Sigma-algebras, sheaves |
| $\mathcal{H}$ | `\mathcal{H}` | Script H | Hilbert spaces |
| $\mathcal{L}$ | `\mathcal{L}` | Script L | Lagrangian, likelihood |
| $\mathcal{N}$ | `\mathcal{N}` | Script N | Normal distribution |
| $\mathcal{O}$ | `\mathcal{O}` | Script O | Landau symbol, structure sheaf |
| $\mathcal{P}$ | `\mathcal{P}` | Script P | Power set |
| $\mathfrak{g}$ | `\mathfrak{g}` | Fraktur g | Lie algebra |
| $\mathfrak{h}$ | `\mathfrak{h}` | Fraktur h | Cartan subalgebra |
| $\mathfrak{p}, \mathfrak{q}$ | `\mathfrak{p}` | Fraktur p, q | Prime ideals |
| $\mathfrak{m}$ | `\mathfrak{m}` | Fraktur m | Maximal ideal |
| $\mathfrak{S}_n$ | `\mathfrak{S}_n` | Fraktur S | Symmetric group |
| $\partial$ | `\partial` | Partial / Curly d | Partial derivative, boundary |
| $\ell$ | `\ell` | Script l | Length, log-likelihood |
| $\hbar$ | `\hbar` | h-bar | Reduced Planck constant |
| $\aleph$ | `\aleph` | Aleph | Cardinal numbers |
| $\beth$ | `\beth` | Beth | Cardinal numbers |
| $\wp$ | `\wp` | Weierstrass p | Weierstrass elliptic function |
| $\Re$ | `\Re` | Real part | Real part of a complex number |
| $\Im$ | `\Im` | Imaginary part | Imaginary part of a complex number |
| $\imath$ | `\imath` | Dotless i | Imaginary unit (alternative) |

---

## Appendix: Common Verbalization Patterns

### Fractions and Expressions

| Formula | Spoken |
|---------|--------|
| $\frac{a}{b}$ | "$a$ over $b$" / "$a$ divided by $b$" |
| $\frac{d}{dx}f(x)$ | "$d f$ $d x$" / "the derivative of $f$ with respect to $x$" |
| $\frac{\partial f}{\partial x_i}$ | "the partial derivative of $f$ with respect to $x_i$" / "partial $f$ partial $x_i$" |
| $\frac{1}{2\pi i} \oint_C$ | "one over two pi $i$, contour integral around $C$" |

### Indices and Exponents

| Formula | Spoken |
|---------|--------|
| $a_{ij}$ | "$a$ sub $i j$" / "$a$ indexed by $i j$" |
| $x^{(k)}$ | "$x$ superscript $k$ in parentheses" / "the $k$-th derivative" (context-dependent) |
| $T^i{}_j$ | "tensor $T$ with upper index $i$ and lower index $j$" |
| $\sum_{i,j}$ | "the sum over $i$ and $j$" |

### Maps and Functions

| Formula | Spoken |
|---------|--------|
| $f: A \to B$ | "$f$ from $A$ to $B$" |
| $x \mapsto x^2$ | "$x$ maps to $x$ squared" |
| $f \circ g$ | "$f$ composed with $g$" / "$f$ of $g$" |
| $f^{-1}(B)$ | "the preimage of $B$ under $f$" |
| $f\|_A$ | "$f$ restricted to $A$" |

---

*Created as a personal language reference for mathematical notation.*
*Based on ISO 80000-2, standard textbook conventions (DE/EN), and lecture practice.*

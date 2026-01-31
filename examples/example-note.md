---
title: Example Note
latex:
  documentclass: article
---

# Introduction

This note demonstrates obs2latex features.

## Equations with Labels

The famous mass-energy equivalence:

$$
E = mc^2
$$
^eq-energy

We can reference this as [[#^eq-energy|Equation 1]].

## Multi-line Equations

Using aligned environments:

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$
^eq-maxwell

Maxwell's equations [[#^eq-maxwell]] describe electromagnetism.

## Theorem Environments

> [!theorem] Pythagorean Theorem
> For a right triangle with legs $a$ and $b$ and hypotenuse $c$:
> $$a^2 + b^2 = c^2$$

> [!proof]
> Consider a square with side length $a + b$...

> [!definition] Prime Number
> A natural number greater than 1 that has no positive divisors other than 1 and itself.

> [!example]
> The first few prime numbers are 2, 3, 5, 7, 11, 13...

> [!remark]
> This is a useful observation about the preceding theorem.

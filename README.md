# ReactRefactor

Refactoring tool and replication package for the empirical study presented in::

> **Refactoring React Component Hierarchies to eliminate Prop Drilling**  
> Vangelis Gkinis, Vassilis E. Zafeiris  
> Submitted to the *Journal of Systems and Software*.
>
> Arxiv preprint: [https://arxiv.org/abs/2610.01376](https://arxiv.org/abs/2610.01376)


## Overview

ReactRefactor is a static analysis tool that identifies refactoring opportunities related to Prop Drilling in React projects.
It analyzes a React codebase and recovers component declarations, 
their properties and parent-child dependencies in the render tree that can be statically inferred from the returned JSX of each component.
Moreover, it captures the flow of data due to prop passings and identifies Prop Drillings and their features (e.g. forwarded properties).

In non interactive mode, ReactRefactor lists all identified Prop Drillings of a given codebase
and suggests applicable strategies for their refactoring, i.g. employment of the Context API or Component Composition.

## Requirements

```text
Node.js >= 22
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Vginis/ReactRefactor
cd ReactRefactor
```

Build the tool:

```bash
npm install
```

## Usage

Run ReactRefactor with:

```bash
node index.js --project <REACT-APP-SRC-DIR> --root <PATH-TO-A-ROOT-COMPONENT>
```

Example:

```bash
node index.js --project ./react-project/app/src --root ./react-project/app/src/main.jsx
```

### Command-line options

| Option | Description |
| --- | --- |
| `--interactive` | Run in interactive mode |
| `--project <path>` | Relative or absolute path to the source folder of the React project |
| `--root <path>` | Relative or absolute path to a source file declaring a root component  |
| `--prefix-mappings <string>` | Mappings of module prefixes in import statements to paths relative to project root, e.g. `"@//=core @//plane-web=ce"` (single space separated). Essential for the analysis of multi-module projects. |


## Reproducing the Paper Results

The repository contains the artifacts required to reproduce 
the experimental evaluation reported in the paper **Refactoring Refactoring React Component Hierarchies to eliminate Prop Drilling**.

The replication package is located in:

```text
study/
```

The replication package contains:

```text
study/
├── index.js        # Entry point to the replication package utility
├── benchmark.js    # JSON description of all projects included in the empirical study
├── latex/          # Latex tables with the empirical study results 
├── log/            # Log files with the output of `ReactRefactor` for each analyzed project
├── results/        # JSON files with the `ReactRefactor` analysis results
├── scripts/        # Required JS source files for running the replication package
```

The execution of the replication package involves the following:
- cloning of benchmark projects in the `../benchmarks` directory,
- checking out an appropriate revision for each project ,
- running the ReactRefactor tool to all projects
- produce latex reports with the results

You can run the whole replication package with the command:

```bash
./run-replication.sh
```

### Artifact corresponding to the paper

The exact version of `ReactRefactor` and the replication package used for the experiments reported in the paper are permanently archived at:

> **Zenodo:** [https://dx.doi.org/10.5281/zenodo.23042867]

The archived release should be used when reproducing the results reported in the paper. 
The `main` branch of this repository may contain subsequent changes to the tool.

## Repository Structure

```text
.
├── src/                 # Tool implementation
├── tests/               # Automated tests
├── study/               # Paper replication package
├── CITATION.cff         # Citation metadata
├── LICENSE
└── README.md
```

## Citation

If you use ReactRefactor in academic work, please cite the associated paper.
Citation information is provided below:

```bibtex
@misc{gkinis2026,
    title={Refactoring React Component Hierarchies to Eliminate Prop Drilling}, 
    author={Vangelis Gkinis and Vassilis E. Zafeiris},
    year={2026},
    eprint={2610.01376},
    archivePrefix={arXiv},
    primaryClass={cs.SE},
    url={https://arxiv.org/abs/2610.01376}, 
}
```

## License

ReactRefactor is released under the [Apache License 2.0](LICENSE).

Unless otherwise noted, the license applies to the source code in this repository. Third-party software and experimental subjects may be distributed under their respective licenses.

## Contributing

This repository primarily contains a research prototype. Bug reports and suggestions are welcome through the repository's issue tracker.

For substantial changes, please open an issue first to discuss the proposed modification.

## Authors

- **VANGELIS GKINIS** — ATHENS UNIVERSITY OF ECONOMICS AND BUSINESS
- **VASSILIS ZAFEIRIS** — UNIVERSITY OF IOANNINA

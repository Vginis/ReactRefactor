# ReactRefactor

The repository includes 

**ReactRefactor** is a refactoring tool implementing the approach presented in:

> **Refactoring React Component Hierarchies to eliminate Prop Drilling**  
> Vangelis Gkinis, Vassilis E. Zafeiris  
> Submitted to the *Journal of Systems and Software*.
>
> Arxiv preprint: [https://arxiv.org](https://arxiv.org/id)


## Overview

ReactRefactor is a static analysis tool that identifies refactoring opportunities related to Prop Drilling in React projects.
In non interactive mode, ReactRefactor lists all identified Prop Drillings 
and their potential for being refactored through employment of the Context API or Component Composition.
In interactive mode, it allows the user to eliminate a selected Prop Drilling through any applicable approach.

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
node index.js <REACT-APP-DIR> <PATH-TO-A-ROOT-COMPONENT>
```

Example:

```bash
node index.js ./example-project ./example-project/app/src/main.jsx
```

### Command-line options

| Option | Description |
| --- | --- |
| `--interactive` | Run in interactive mode |
| `--refactoring <name>` | Select the refactoring to apply |
| `[OPTION]` | [DESCRIPTION] |


## Reproducing the Paper Results

The repository contains the artifacts required to reproduce the experimental evaluation reported in the associated paper.

The replication package is located in:

```text
study/
```

The replication package contains:

```text
replication/
├── README.md
├── subjects/       # Projects/subjects used in the evaluation
├── scripts/        # Experiment and analysis scripts
├── data/           # Input and/or raw experimental data
└── results/        # Expected or generated results
```

The instructions describe how to reproduce the experiments corresponding to each research question:

- **RQ1:** [Short description]
- **RQ2:** [Short description]
- **RQ3:** [Short description]

### Artifact corresponding to the paper

The exact version of TOOL_NAME and the replication package used for the experiments reported in the paper are permanently archived at:

> **Zenodo:** [DOI / link to archived release]

The archived release should be used when reproducing the results reported in the paper. The `main` branch of this repository may contain subsequent changes to the tool.

## Repository Structure

```text
.
├── src/                 # Tool implementation
├── tests/               # Automated tests
├── examples/            # Usage examples
├── replication/         # Paper replication package
├── CITATION.cff         # Citation metadata
├── LICENSE
└── README.md
```

## Citation

If you use ReactRefactor in academic work, please cite the associated paper.

Citation information is provided in [`CITATION.cff`](CITATION.cff).

Once published:

```bibtex
@article{CITATION_KEY,
  author  = {AUTHOR_1 and AUTHOR_2},
  title   = {PAPER_TITLE},
  journal = {Journal of Systems and Software},
  year    = {YEAR},
  volume  = {VOLUME},
  pages   = {PAGES},
  doi     = {DOI}
}
```

The specific software artifact used in the evaluation can also be cited using its Zenodo DOI:

```text
[ZENODO SOFTWARE CITATION]
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

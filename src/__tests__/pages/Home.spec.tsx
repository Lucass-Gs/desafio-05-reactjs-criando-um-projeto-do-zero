import { render, screen, waitFor } from '@testing-library/react';
import { GetStaticPropsContext } from 'next';
import { ParsedUrlQuery } from 'querystring';
import userEvent from '@testing-library/user-event';
import { createClient } from '../../../prismicio';
import App, { getStaticProps } from '../../pages';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

interface GetStaticPropsResult {
  props: HomeProps;
}

const mockedGetByTypeReturn = {
  next_page: 'link',
  results: [
    {
      uid: 'como-utilizar-hooks',
      first_publication_date: '2021-03-15T19:25:28+0000',
      data: {
        title: 'Como utilizar Hooks',
        subtitle: 'Pensando em sincronização em vez de ciclos de vida',
        author: 'Joseph Oliveira',
      },
    },
    {
      uid: 'criando-um-app-cra-do-zero',
      first_publication_date: '2021-03-25T19:27:35+0000',
      data: {
        title: 'Criando um app CRA do zero',
        subtitle:
          'Tudo sobre como criar a sua primeira aplicação utilizando Create React App',
        author: 'Danilo Vieira',
      },
    },
  ],
};

jest.mock('../../../prismicio');
jest.mock('../../services/prismic');

const mockedPrismic = createClient as jest.Mock;
const mockedFetch = jest.spyOn(window, 'fetch') as jest.Mock;
const mockedPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: mockedPush,
    };
  },
}));
const mockedRouter = {
  push: mockedPush,
};
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockImplementation(() => mockedRouter),
}));

describe('Home', () => {
  beforeAll(() => {
    mockedPush.mockImplementation(() => Promise.resolve());
    jest.mock('next/router', () => ({
      useRouter: jest.fn(),
    }));

    mockedPrismic.mockReturnValue({
      getByType: () => {
        return Promise.resolve(mockedGetByTypeReturn);
      },
    });

    mockedFetch.mockImplementation(() => {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            next_page: null,
            results: [
              {
                uid: 'criando-um-app-cra-do-zero',
                first_publication_date: '2021-03-25T19:27:35+0000',
                data: {
                  title: 'Criando um app CRA do zero',
                  subtitle:
                    'Tudo sobre como criar a sua primeira aplicação utilizando Create React App',
                  author: 'Danilo Vieira',
                },
              },
            ],
          }),
      });
    });
  });

  it('should be able to return prismic posts documents using getStaticProps', async () => {
    const postsPaginationReturn = mockedGetByTypeReturn;

    const getStaticPropsContext: GetStaticPropsContext<ParsedUrlQuery> = {};

    const response = (await getStaticProps(
      getStaticPropsContext
    )) as GetStaticPropsResult;

    expect(response.props.postsPagination.next_page).toEqual(
      postsPaginationReturn.next_page
    );
    expect(response.props.postsPagination.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(postsPaginationReturn.results[0]),
        expect.objectContaining(postsPaginationReturn.results[1]),
      ])
    );
  });
  it('should be able to render posts documents info', () => {
    const postsPagination = mockedGetByTypeReturn;

    render(<App postsPagination={postsPagination} />);

    screen.getByText('Como utilizar Hooks');
    screen.getByText('Pensando em sincronização em vez de ciclos de vida');
    screen.getByText('15 mar 2021');
    screen.getByText('Joseph Oliveira');

    screen.getByText('Criando um app CRA do zero');
    screen.getByText(
      'Tudo sobre como criar a sua primeira aplicação utilizando Create React App'
    );
    screen.getByText('15 mar 2021');
    screen.getByText('Danilo Vieira');
  });

  it('should be able to navigate to post page after a click', () => {
    const postsPagination = mockedGetByTypeReturn;

    render(<App postsPagination={postsPagination} />);

    const firstPostLink = screen.getByRole('link', {
      name: /Como utilizar Hooks/i,
    });
    const secondPostLink = screen.getByRole('link', {
      name: /Criando um app CRA do zero/i,
    });

    expect(firstPostLink).toHaveAttribute('href', '/post/como-utilizar-hooks');
    expect(secondPostLink).toHaveAttribute(
      'href',
      '/post/criando-um-app-cra-do-zero'
    );
  });

  it('should be able to load more posts if available', async () => {
    const postsPagination = { ...mockedGetByTypeReturn };
    postsPagination.results = [
      {
        uid: 'como-utilizar-hooks',
        first_publication_date: '2021-03-15T19:25:28+0000',
        data: {
          title: 'Como utilizar Hooks',
          subtitle: 'Pensando em sincronização em vez de ciclos de vida',
          author: 'Joseph Oliveira',
        },
      },
    ];

    render(<App postsPagination={postsPagination} />);

    screen.getByText('Como utilizar Hooks');
    const loadMorePostsButton = screen.getByText('Carregar mais posts');

    userEvent.click(loadMorePostsButton);

    await waitFor(
      () => {
        expect(mockedFetch).toHaveBeenCalled();
      },
      { timeout: 200 }
    );

    screen.getByText('Criando um app CRA do zero');
  });

  it('should not be able to load more posts if not available', async () => {
    const postsPagination = mockedGetByTypeReturn;
    postsPagination.next_page = null;

    render(<App postsPagination={postsPagination} />);

    screen.getByText('Como utilizar Hooks');
    screen.getByText('Criando um app CRA do zero');
    const loadMorePostsButton = screen.queryByText('Carregar mais posts');

    expect(loadMorePostsButton).not.toBeInTheDocument();
  });
});

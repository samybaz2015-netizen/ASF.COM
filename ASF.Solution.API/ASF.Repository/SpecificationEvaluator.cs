 using Microsoft.EntityFrameworkCore;
using ASF.Core.Specification;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace ASF.Repository
{
    public static class SpecificationEvaluator<TEntity> where TEntity : class
    {
        public static IQueryable<TEntity> GetQurey(IQueryable<TEntity> firstQurey, ISpecification<TEntity> spec)
        {
            var query = firstQurey; //dbcontext.set<T>().where,include;

            if (spec.Critaria is not null)
            {
                query = query.Where(spec.Critaria);
            }
            if (spec.OrderBy is not null)
            {
                query = query.OrderBy(spec.OrderBy);
            }
            if (spec.OrderByDescening is not null)
            {
                query = query.OrderByDescending(spec.OrderByDescening);
            }
            if (spec.IsPaginatedEnable)
            {
                query = query.Skip(spec.Skip).Take(spec.Take);
            }

            query = spec.Includes.Aggregate(query, (currentQuery, includeExpression) => currentQuery.Include(includeExpression));

            return query;

        }
    }
}


class Project < ApplicationRecord
    has_many :projects_users, dependent: :destroy
    has_many :users, through: :projects_users
    has_many :deliverables, dependent: :destroy
    has_many :tasks, dependent: :destroy  
    accepts_nested_attributes_for :deliverables, allow_destroy: true
end

